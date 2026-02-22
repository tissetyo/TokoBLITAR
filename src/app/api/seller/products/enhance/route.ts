import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Helper: call HuggingFace with retry on 503 (model loading)
async function callHuggingFace(model: string, imageBuffer: Buffer, token: string, retries = 2): Promise<ArrayBuffer> {
    for (let i = 0; i <= retries; i++) {
        const res = await fetch(
            `https://api-inference.huggingface.co/models/${model}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/octet-stream',
                    'x-wait-for-model': 'true',
                },
                body: new Uint8Array(imageBuffer),
            },
        )

        if (res.ok) {
            return res.arrayBuffer()
        }

        const errText = await res.text()
        console.error(`HF ${model} attempt ${i + 1}:`, res.status, errText)

        // If model is loading, wait and retry
        if (res.status === 503 && i < retries) {
            await new Promise(r => setTimeout(r, 5000))
            continue
        }

        if (res.status === 503) {
            throw new Error('MODEL_LOADING')
        }

        throw new Error(`HuggingFace error ${res.status}: ${errText.slice(0, 200)}`)
    }

    throw new Error('Max retries exceeded')
}

// POST: Enhance product photo using Hugging Face
export async function POST(request: Request) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const hfToken = process.env.HF_API_TOKEN
    if (!hfToken) {
        return NextResponse.json({ error: 'HF_API_TOKEN belum di-set' }, { status: 503 })
    }

    let body
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { image_base64, action } = body

    if (!image_base64) {
        return NextResponse.json({ error: 'image_base64 is required' }, { status: 400 })
    }

    const imageBuffer = Buffer.from(image_base64, 'base64')
    console.log(`[enhance] action=${action}, imageSize=${imageBuffer.length} bytes`)

    try {
        if (action === 'remove_bg') {
            const resultBuffer = await callHuggingFace('briaai/RMBG-1.4', imageBuffer, hfToken)
            const resultBase64 = Buffer.from(resultBuffer).toString('base64')
            return NextResponse.json({ result: `data:image/png;base64,${resultBase64}` })
        }

        if (action === 'upscale') {
            const resultBuffer = await callHuggingFace('caidas/swin2SR-classical-sr-x2-64', imageBuffer, hfToken)
            const resultBase64 = Buffer.from(resultBuffer).toString('base64')
            return NextResponse.json({ result: `data:image/png;base64,${resultBase64}` })
        }

        if (action === 'enhance') {
            // Remove background
            const noBgBuffer = await callHuggingFace('briaai/RMBG-1.4', imageBuffer, hfToken)
            const resultBase64 = Buffer.from(noBgBuffer).toString('base64')
            return NextResponse.json({ result: `data:image/png;base64,${resultBase64}` })
        }

        return NextResponse.json({ error: `Action "${action}" tidak dikenali` }, { status: 400 })
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        console.error('[enhance] Error:', msg)

        if (msg === 'MODEL_LOADING') {
            return NextResponse.json({ error: 'Model AI sedang loading. Coba lagi dalam 30 detik.' }, { status: 503 })
        }

        return NextResponse.json({ error: `Gagal enhance foto: ${msg}` }, { status: 500 })
    }
}
