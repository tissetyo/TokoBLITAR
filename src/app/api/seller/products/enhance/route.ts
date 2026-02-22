import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { InferenceClient } from '@huggingface/inference'

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
    const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' })
    console.log(`[enhance] action=${action}, size=${(imageBuffer.length / 1024).toFixed(0)}KB`)

    const client = new InferenceClient(hfToken)

    try {
        if (action === 'remove_bg' || action === 'enhance') {
            // Use the library — it auto-routes to the correct inference provider
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result: any = await client.imageSegmentation({
                model: 'briaai/RMBG-2.0',
                inputs: imageBlob,
                provider: 'hf-inference',
            })

            // Result can be Blob, ArrayBuffer, or array of segments
            let outputBuffer: ArrayBuffer | null = null

            if (result instanceof Blob) {
                outputBuffer = await result.arrayBuffer()
            } else if (result instanceof ArrayBuffer) {
                outputBuffer = result
            } else if (Array.isArray(result) && result.length > 0) {
                const first = result[0]
                if (first.mask instanceof Blob) {
                    outputBuffer = await first.mask.arrayBuffer()
                } else if (typeof first.mask === 'string') {
                    // mask might be base64
                    return NextResponse.json({ result: `data:image/png;base64,${first.mask}` })
                }
            }

            if (outputBuffer) {
                const resultBase64 = Buffer.from(outputBuffer).toString('base64')
                return NextResponse.json({ result: `data:image/png;base64,${resultBase64}` })
            }

            console.error('[enhance] Unexpected result type:', typeof result, JSON.stringify(result).slice(0, 200))
            return NextResponse.json({ error: 'Format hasil tidak dikenali' }, { status: 500 })
        }

        if (action === 'upscale') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result: any = await (client as any).imageToImage({
                model: 'caidas/swin2SR-classical-sr-x2-64',
                inputs: imageBlob,
                provider: 'hf-inference',
            })

            let outputBuffer: ArrayBuffer | null = null
            if (result instanceof Blob) {
                outputBuffer = await result.arrayBuffer()
            } else if (result instanceof ArrayBuffer) {
                outputBuffer = result
            }

            if (outputBuffer) {
                const resultBase64 = Buffer.from(outputBuffer).toString('base64')
                return NextResponse.json({ result: `data:image/png;base64,${resultBase64}` })
            }

            return NextResponse.json({ error: 'Gagal upscale' }, { status: 500 })
        }

        return NextResponse.json({ error: `Action "${action}" tidak dikenali` }, { status: 400 })
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[enhance] Error:', msg)

        // Provide helpful error messages
        if (msg.includes('loading') || msg.includes('503')) {
            return NextResponse.json({ error: 'Model AI sedang loading. Coba lagi dalam 30 detik.' }, { status: 503 })
        }
        if (msg.includes('401') || msg.includes('403')) {
            return NextResponse.json({ error: 'Token HuggingFace tidak valid atau tidak punya akses ke model ini.' }, { status: 403 })
        }
        if (msg.includes('rate') || msg.includes('429')) {
            return NextResponse.json({ error: 'Rate limit tercapai. Coba lagi nanti.' }, { status: 429 })
        }

        return NextResponse.json({ error: `Gagal enhance: ${msg}` }, { status: 500 })
    }
}
