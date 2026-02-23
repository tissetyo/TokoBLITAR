import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Flow:
// 1. Send uploaded raw photo to Gemini Vision to get a detailed description prompt
// 2. Send that description to Cloudflare SDXL to generate a professional photo
export async function POST(request: Request) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body
    try { body = await request.json() } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { image_base64, action, product_name, visionModel = '@cf/llava-hf/llava-1.5-7b-hf', promptText, customInstruction } = body
    if (!image_base64 && action !== 'generate_from_prompt') {
        return NextResponse.json({ error: 'Image is required' }, { status: 400 })
    }

    try {
        console.log(`[enhance] Starting enhancement. Action: ${action}`)

        // Only support these actions
        if (!['remove_bg', 'enhance', 'studio_background', 'generate_from_prompt'].includes(action)) {
            return NextResponse.json({ error: 'Aksi tidak didukung.' }, { status: 400 })
        }

        // Clean base64 string
        const base64Data = image_base64?.includes(',') ? image_base64.split(',')[1] : image_base64
        const imageBuffer = base64Data ? Buffer.from(base64Data, 'base64') : undefined

        if (action === 'studio_background' || action === 'enhance' || action === 'generate_from_prompt') {
            const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
            const aiToken = process.env.CLOUDFLARE_AI_TOKEN

            if (!accountId || !aiToken) {
                return NextResponse.json({ error: 'Layanan AI belum dikonfigurasi sepenuhnya (Butuh Cloudflare API Key)' }, { status: 503 })
            }

            // Direct Img2Img fallback for 'enhance' and 'studio_background'
            const basePrompt = customInstruction || promptText || (action === 'studio_background' ? 'professional product photography, studio lighting, smooth solid color background' : 'high quality, enhanced details, vibrant colors')
            const finalImagePrompt = `${basePrompt}. Highly detailed, photorealistic, 4k.`;

            console.log(`[enhance] Generating image with prompt: ${finalImagePrompt}`)
            console.log(`[enhance] Calling Cloudflare SDXL for Generation...`)

            const sdRes = await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/runwayml/stable-diffusion-v1-5-img2img`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${aiToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        prompt: finalImagePrompt,
                        image: Array.from(new Uint8Array(imageBuffer!)),
                        strength: 0.45, // Protect original pixels and geometry (0.45 retains structure, lets AI tweak details and background)
                        num_steps: 20,
                        guidance: 7.5
                    }),
                },
            )

            if (!sdRes.ok) {
                const err = await sdRes.json().catch(() => ({}))
                console.error('Cloudflare AI error:', err)
                throw new Error('Gagal melakukan render gambar di Cloudflare SDXL')
            }

            const cfImageBuffer = await sdRes.arrayBuffer()
            const outBase64 = Buffer.from(cfImageBuffer).toString('base64')

            return NextResponse.json({ result: `data:image/png;base64,${outBase64}` })
        }

        // --- HUGGINGFACE BACKGROUND REMOVAL ACTION ---
        const hfKey = process.env.HUGGINGFACE_API_KEY
        if (!hfKey) {
            return NextResponse.json({ error: 'HUGGINGFACE_API_KEY belum dikonfigurasi di server' }, { status: 500 })
        }

        // Fetch using Hugging Face Inference API directly
        console.log(`[enhance] Calling Hugging Face Inference API (briaai/RMBG-1.4)...`)
        const hfRes = await fetch(
            "https://api-inference.huggingface.co/models/briaai/RMBG-1.4",
            {
                headers: {
                    Authorization: `Bearer ${hfKey}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: imageBuffer,
            }
        );

        if (!hfRes.ok) {
            const errText = await hfRes.text().catch(() => '')
            console.error('[enhance] HF API failed:', hfRes.status, errText)

            if (hfRes.status === 503) {
                return NextResponse.json({ error: 'Model AI sedang loading, silakan coba lagi dalam 10 detik.' }, { status: 503 })
            }
            throw new Error('Gagal memproses gambar. Server AI mungkin sedang sibuk.')
        }

        const outBuffer = await hfRes.arrayBuffer()
        const outBase64 = Buffer.from(outBuffer).toString('base64')

        return NextResponse.json({ result: `data:image/png;base64,${outBase64}` })

    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[enhance] Error:', msg)
        return NextResponse.json({ error: `Gagal enhance: ${msg}` }, { status: 500 })
    }
}
