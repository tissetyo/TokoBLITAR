import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

// POST: enhance a product photo using Cloudflare Llama 3.2 Vision (Analysis) + Cloudflare SDXL (Generation)
export async function POST(request: Request, { params }: Params) {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify product ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: product } = await (supabase as any)
        .from('products')
        .select('id, name, stores!inner(user_id)')
        .eq('id', id)
        .single()

    if (!product || product.stores.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { imageBase64, customPrompt } = await request.json()

    if (!imageBase64) {
        return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
    const aiToken = process.env.CLOUDFLARE_AI_TOKEN

    if (!accountId || !aiToken) {
        return NextResponse.json({ error: 'AI Services not fully configured. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_AI_TOKEN' }, { status: 503 })
    }

    try {
        const body = await request.json()
        const { image_url, action = 'enhance', maskBase64, promptText, customInstruction } = body

        if (!image_url && !imageBase64) {
            return NextResponse.json({ error: 'Image URL or Base64 is required' }, { status: 400 })
        }

        if (!['enhance', 'generate_from_prompt', 'inpaint', 'detect_object'].includes(action)) {
            return NextResponse.json({ error: 'Aksi tidak didukung.' }, { status: 400 })
        }

        // Re-declare accountId and aiToken if they were not already defined, or ensure they are used from the outer scope
        const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
        const aiToken = process.env.CLOUDFLARE_AI_TOKEN

        if (!accountId || !aiToken) {
            return NextResponse.json({ error: 'AI Services not configured' }, { status: 503 })
        }

        let base64Data: string = '';
        // Always extract base64Data because img2img generation requires the base model image
        if (image_url) {
            // 1. Fetch the actual image from the bucket to get base64
            const imgRes = await fetch(image_url)
            const arrayBuffer = await imgRes.arrayBuffer()
            base64Data = Buffer.from(arrayBuffer).toString('base64')
        } else if (imageBase64) {
            // Strip the data:image prefix if present to get raw base64
            base64Data = imageBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, "")
        }

        const imageBuffer = Buffer.from(base64Data, 'base64')

        if (action === 'detect_object') {
            const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/facebook/detr-resnet-50`;
            const cfRes = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${aiToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: Array.from(new Uint8Array(imageBuffer)) })
            });
            if (!cfRes.ok) throw new Error('Cloudflare Object Detection failed');
            const data = await cfRes.json();
            return NextResponse.json({ result: data.result }); // returns array of {score, label, box: {xmin,ymin,xmax,ymax}}
        }

        if (action === 'enhance' || action === 'generate_from_prompt' || action === 'inpaint') {
            const basePrompt = customInstruction || promptText || 'high quality, enhanced details, vibrant colors';
            const finalImagePrompt = `${basePrompt}. Highly detailed, photorealistic, 4k.`;

            console.log(`[enhance-photo] Generating image with prompt: ${finalImagePrompt} [Action: ${action}]`);

            let endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/runwayml/stable-diffusion-v1-5-img2img`;
            let reqBody: any = {
                prompt: finalImagePrompt,
                image: Array.from(new Uint8Array(imageBuffer)),
                strength: 0.45,
                num_steps: 20,
                guidance: 7.5
            };

            if (action === 'inpaint') {
                if (!maskBase64) {
                    return NextResponse.json({ error: 'Mask is required for inpainting' }, { status: 400 })
                }
                endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/runwayml/stable-diffusion-v1-5-inpainting`;
                const maskData = maskBase64.includes(',') ? maskBase64.split(',')[1] : maskBase64;
                const maskBuffer = Buffer.from(maskData, 'base64');
                reqBody = {
                    prompt: finalImagePrompt,
                    image: Array.from(new Uint8Array(imageBuffer)),
                    mask: Array.from(new Uint8Array(maskBuffer)),
                    num_steps: 20,
                    guidance: 7.5
                };
            }

            const cfRes = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${aiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reqBody),
            })

            if (!cfRes.ok) {
                const err = await cfRes.json().catch(() => ({}))
                console.error('Cloudflare AI error:', err)
                throw new Error('Image generation failed at SDXL step')
            }

            // Cloudflare returns raw image bytes
            const cfImageBuffer = await cfRes.arrayBuffer()
            const outBase64 = Buffer.from(cfImageBuffer).toString('base64')
            const dataUrl = `data:image/png;base64,${outBase64}`

            return NextResponse.json({
                image_url: dataUrl,
                prompt_used: finalImagePrompt,
                status: 'succeeded',
            })
        }


    } catch (err: any) {
        console.error('[AI Pipeline Error]:', err)
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
    }
}
