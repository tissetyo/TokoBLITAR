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

    const { image_base64, action, mask_base64, product_name, visionModel = '@cf/llava-hf/llava-1.5-7b-hf', promptText, customInstruction } = body
    if (!image_base64 && action !== 'generate_from_prompt') {
        return NextResponse.json({ error: 'Image is required' }, { status: 400 })
    }

    try {
        console.log(`[enhance] Starting enhancement. Action: ${action}`)

        if (!['enhance', 'studio_background', 'generate_from_prompt', 'inpaint'].includes(action)) {
            return NextResponse.json({ error: 'Aksi tidak didukung.' }, { status: 400 })
        }

        // Clean base64 string
        const base64Data = image_base64?.includes(',') ? image_base64.split(',')[1] : image_base64
        const imageBuffer = base64Data ? Buffer.from(base64Data, 'base64') : undefined

        if (action === 'studio_background' || action === 'enhance' || action === 'generate_from_prompt' || action === 'inpaint') {
            const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
            const aiToken = process.env.CLOUDFLARE_AI_TOKEN

            if (!accountId || !aiToken) {
                return NextResponse.json({ error: 'Layanan AI belum dikonfigurasi sepenuhnya (Butuh Cloudflare API Key)' }, { status: 503 })
            }

            const basePrompt = customInstruction || promptText || (action === 'studio_background' ? 'professional product photography, studio lighting, smooth solid color background' : 'high quality, enhanced details, vibrant colors')
            const finalImagePrompt = `${basePrompt}. Highly detailed, photorealistic, 4k.`;

            console.log(`[enhance] Generating image with prompt: ${finalImagePrompt} [Action: ${action}]`)

            let endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/runwayml/stable-diffusion-v1-5-img2img`;
            let reqBody: any = {
                prompt: finalImagePrompt,
                image: Array.from(new Uint8Array(imageBuffer!)),
                strength: 0.45, // Protect original pixels and geometry
                num_steps: 20,
                guidance: 7.5
            };

            if (action === 'inpaint') {
                if (!mask_base64) {
                    return NextResponse.json({ error: 'Mask is required for inpainting' }, { status: 400 })
                }
                endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/runwayml/stable-diffusion-v1-5-inpainting`;
                const maskData = mask_base64.includes(',') ? mask_base64.split(',')[1] : mask_base64;
                const maskBuffer = Buffer.from(maskData, 'base64');
                reqBody = {
                    prompt: finalImagePrompt,
                    image: Array.from(new Uint8Array(imageBuffer!)),
                    mask: Array.from(new Uint8Array(maskBuffer)),
                    num_steps: 20,
                    guidance: 7.5
                };
            }

            const sdRes = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${aiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reqBody),
            })

            if (!sdRes.ok) {
                const err = await sdRes.json().catch(() => ({}))
                console.error('Cloudflare AI error:', err)
                throw new Error('Gagal melakukan render gambar di Cloudflare')
            }

            const cfImageBuffer = await sdRes.arrayBuffer()
            const outBase64 = Buffer.from(cfImageBuffer).toString('base64')

            return NextResponse.json({ result: `data:image/png;base64,${outBase64}` })
        }



    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[enhance] Error:', msg)
        return NextResponse.json({ error: `Gagal enhance: ${msg}` }, { status: 500 })
    }
}
