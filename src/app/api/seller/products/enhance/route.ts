import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

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
    // image_base64 should be the raw base64 string (without data:image prefix)

    if (!image_base64) {
        return NextResponse.json({ error: 'image_base64 is required' }, { status: 400 })
    }

    const imageBuffer = Buffer.from(image_base64, 'base64')

    try {
        if (action === 'remove_bg') {
            // --- BACKGROUND REMOVAL using RMBG-2.0 ---
            const hfRes = await fetch(
                'https://api-inference.huggingface.co/models/briaai/RMBG-2.0',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${hfToken}`,
                        'Content-Type': 'application/octet-stream',
                    },
                    body: imageBuffer,
                },
            )

            if (!hfRes.ok) {
                const errText = await hfRes.text()
                console.error('HF remove_bg error:', hfRes.status, errText)
                if (hfRes.status === 503) {
                    return NextResponse.json({ error: 'Model sedang loading (~20 detik). Coba lagi.' }, { status: 503 })
                }
                return NextResponse.json({ error: 'Gagal hapus background' }, { status: 500 })
            }

            const resultBuffer = await hfRes.arrayBuffer()
            const resultBase64 = Buffer.from(resultBuffer).toString('base64')
            return NextResponse.json({ result: `data:image/png;base64,${resultBase64}` })
        }

        if (action === 'upscale') {
            // --- UPSCALE using Real-ESRGAN ---
            const hfRes = await fetch(
                'https://api-inference.huggingface.co/models/caidas/swin2SR-lightweight-x2-64',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${hfToken}`,
                        'Content-Type': 'application/octet-stream',
                    },
                    body: imageBuffer,
                },
            )

            if (!hfRes.ok) {
                const errText = await hfRes.text()
                console.error('HF upscale error:', hfRes.status, errText)
                if (hfRes.status === 503) {
                    return NextResponse.json({ error: 'Model sedang loading (~20 detik). Coba lagi.' }, { status: 503 })
                }
                return NextResponse.json({ error: 'Gagal upscale foto' }, { status: 500 })
            }

            const resultBuffer = await hfRes.arrayBuffer()
            const resultBase64 = Buffer.from(resultBuffer).toString('base64')
            return NextResponse.json({ result: `data:image/png;base64,${resultBase64}` })
        }

        if (action === 'enhance') {
            // --- FULL ENHANCE: remove bg first, then return ---
            // Step 1: Remove background
            const bgRes = await fetch(
                'https://api-inference.huggingface.co/models/briaai/RMBG-2.0',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${hfToken}`,
                        'Content-Type': 'application/octet-stream',
                    },
                    body: imageBuffer,
                },
            )

            if (!bgRes.ok) {
                const errText = await bgRes.text()
                console.error('HF enhance bg error:', bgRes.status, errText)
                if (bgRes.status === 503) {
                    return NextResponse.json({ error: 'Model sedang loading (~20 detik). Coba lagi.' }, { status: 503 })
                }
                return NextResponse.json({ error: 'Gagal enhance foto' }, { status: 500 })
            }

            const noBgBuffer = await bgRes.arrayBuffer()

            // Step 2: Upscale
            const upRes = await fetch(
                'https://api-inference.huggingface.co/models/caidas/swin2SR-lightweight-x2-64',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${hfToken}`,
                        'Content-Type': 'application/octet-stream',
                    },
                    body: Buffer.from(noBgBuffer),
                },
            )

            if (upRes.ok) {
                const upBuffer = await upRes.arrayBuffer()
                const resultBase64 = Buffer.from(upBuffer).toString('base64')
                return NextResponse.json({ result: `data:image/png;base64,${resultBase64}` })
            }

            // If upscale fails, return bg-removed version
            const resultBase64 = Buffer.from(noBgBuffer).toString('base64')
            return NextResponse.json({ result: `data:image/png;base64,${resultBase64}` })
        }

        return NextResponse.json({ error: `Action "${action}" tidak dikenali. Gunakan: remove_bg, upscale, enhance` }, { status: 400 })
    } catch (err) {
        console.error('Photo enhance error:', err)
        return NextResponse.json({ error: 'Gagal enhance foto' }, { status: 500 })
    }
}
