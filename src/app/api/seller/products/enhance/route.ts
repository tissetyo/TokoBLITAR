import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const HF_MODELS = {
    remove_bg: 'briaai/RMBG-1.4',
    upscale: 'caidas/swin2SR-classical-sr-x2-64',
}

async function callHF(model: string, imageBuffer: Buffer, token: string): Promise<ArrayBuffer> {
    // Try new router URL first, then fallback to old API
    const urls = [
        `https://router.huggingface.co/hf-inference/models/${model}`,
        `https://api-inference.huggingface.co/models/${model}`,
    ]

    let lastError = ''
    for (const url of urls) {
        console.log(`[enhance] Trying: ${url}`)
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/octet-stream',
                'x-wait-for-model': 'true',
            },
            body: new Uint8Array(imageBuffer),
        })

        if (res.ok) {
            const contentType = res.headers.get('content-type') || ''
            if (contentType.includes('image') || contentType.includes('octet')) {
                return res.arrayBuffer()
            }
            // If not image, might be JSON error
            const text = await res.text()
            console.error(`[enhance] Got non-image response:`, text.slice(0, 200))
            lastError = text.slice(0, 200)
            continue
        }

        const errText = await res.text().catch(() => '')
        console.error(`[enhance] ${url} failed:`, res.status, errText.slice(0, 200))
        lastError = `${res.status}: ${errText.slice(0, 200)}`

        // 410 Gone = endpoint deprecated, try next URL
        if (res.status === 410) continue
        // 503 = model loading
        if (res.status === 503) {
            throw new Error('Model AI sedang loading. Coba lagi dalam 30 detik.')
        }
    }

    throw new Error(`Semua endpoint gagal. ${lastError}`)
}

export async function POST(request: Request) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const hfToken = process.env.HF_API_TOKEN
    if (!hfToken) {
        return NextResponse.json({ error: 'HF_API_TOKEN belum di-set' }, { status: 503 })
    }

    let body
    try { body = await request.json() } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { image_base64, action } = body
    if (!image_base64) {
        return NextResponse.json({ error: 'image_base64 is required' }, { status: 400 })
    }

    const imageBuffer = Buffer.from(image_base64, 'base64')
    console.log(`[enhance] action=${action}, size=${(imageBuffer.length / 1024).toFixed(0)}KB`)

    try {
        if (action === 'remove_bg' || action === 'enhance') {
            const resultBuffer = await callHF(HF_MODELS.remove_bg, imageBuffer, hfToken)
            const resultBase64 = Buffer.from(resultBuffer).toString('base64')
            return NextResponse.json({ result: `data:image/png;base64,${resultBase64}` })
        }

        if (action === 'upscale') {
            const resultBuffer = await callHF(HF_MODELS.upscale, imageBuffer, hfToken)
            const resultBase64 = Buffer.from(resultBuffer).toString('base64')
            return NextResponse.json({ result: `data:image/png;base64,${resultBase64}` })
        }

        return NextResponse.json({ error: `Action "${action}" tidak dikenali` }, { status: 400 })
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        console.error('[enhance] Error:', msg)
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
