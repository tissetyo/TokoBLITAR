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
        let model = ''
        let prompt = ''

        if (action === 'remove_bg') {
            model = 'FireRedTeam/FireRed-Image-Edit-1.0'
            prompt = 'remove the background and replace with plain white background, keep the product intact'
        } else if (action === 'enhance') {
            model = 'prithivMLmods/Photo-Restore-i2i'
            prompt = 'enhance this product photo, make it look professional with clean lighting, sharp details, vibrant colors, studio quality'
        } else if (action === 'upscale') {
            model = 'prithivMLmods/Qwen-Image-Edit-2511-Unblur-Upscale'
            prompt = 'upscale and sharpen this image, remove blur, enhance details and clarity'
        } else {
            return NextResponse.json({ error: `Action "${action}" tidak dikenali` }, { status: 400 })
        }

        console.log(`[enhance] Using model: ${model}`)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = await client.imageToImage({
            model,
            inputs: imageBlob,
            parameters: { prompt },
            provider: 'hf-inference',
        })

        // Result is typically a Blob
        let outputBuffer: ArrayBuffer | null = null

        if (result instanceof Blob) {
            outputBuffer = await result.arrayBuffer()
        } else if (result instanceof ArrayBuffer) {
            outputBuffer = result
        } else if (result && typeof result === 'object' && 'arrayBuffer' in result) {
            outputBuffer = await result.arrayBuffer()
        }

        if (outputBuffer && outputBuffer.byteLength > 100) {
            const resultBase64 = Buffer.from(outputBuffer).toString('base64')
            return NextResponse.json({ result: `data:image/png;base64,${resultBase64}` })
        }

        console.error('[enhance] Empty or invalid result:', typeof result)
        return NextResponse.json({ error: 'Hasil kosong dari AI. Coba lagi.' }, { status: 500 })
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[enhance] Error:', msg)

        if (msg.includes('loading') || msg.includes('503')) {
            return NextResponse.json({ error: 'Model AI sedang loading (~30 detik). Coba lagi.' }, { status: 503 })
        }
        if (msg.includes('401') || msg.includes('403') || msg.includes('Token')) {
            return NextResponse.json({ error: 'Token HuggingFace tidak valid.' }, { status: 403 })
        }
        if (msg.includes('pre-paid') || msg.includes('credits')) {
            return NextResponse.json({ error: 'Model ini butuh credits berbayar. Coba action lain.' }, { status: 402 })
        }
        if (msg.includes('not been able to find')) {
            return NextResponse.json({ error: 'Model tidak tersedia di free inference. Coba action lain.' }, { status: 404 })
        }

        return NextResponse.json({ error: `Gagal enhance: ${msg}` }, { status: 500 })
    }
}
