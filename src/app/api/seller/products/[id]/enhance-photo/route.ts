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
        // --- STEP 1: Vision Analysis via Cloudflare Llama 3.2 Vision ---
        let generatedPrompt = ''

        // Strip the data:image prefix if present to get raw base64
        const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, "")

        const visionPrompt = `
        Analyze this product image carefully.
        Write a highly detailed text-to-image prompt (Midjourney style) to recreate this exact product in a professional, aesthetic studio setting.
        Describe the exact shape, color, typography, and recognizable branding of the main object you see.
        Place it on a premium aesthetic background (e.g. marble table, wooden desk, soft pastel backdrop, or nature setting depending on context).
        Use dramatic studio lighting, sharp focus, 8k resolution, photorealistic.
        ONLY Output the prompt text, nothing else. No intro, no markdown. 
        Focus strictly on making the main product look identical to the one in the photo.
        ${customPrompt ? `Additional user instruction: ${customPrompt}` : `Product context name: ${product.name}`}
        `

        console.log(`[AI Pipeline] Calling Cloudflare Llama 3.2 Vision for Image Analysis...`)

        const llamaRes = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${aiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: '@cf/meta/llama-3.2-11b-vision-instruct',
                    messages: [
                        {
                            role: 'user',
                            content: [
                                { type: 'text', text: visionPrompt },
                                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Data}` } }
                            ]
                        }
                    ],
                    max_tokens: 256
                })
            }
        )

        if (!llamaRes.ok) {
            const err = await llamaRes.json().catch(() => ({}))
            console.error('Cloudflare Vision AI error:', err)
            throw new Error("Cloudflare Llama failed to analyze image")
        }

        const llamaData = await llamaRes.json().catch(() => ({}))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        generatedPrompt = (llamaData as any).choices?.[0]?.message?.content?.trim()

        if (!generatedPrompt) throw new Error("Cloudflare Llama returned empty prompt")

        console.log(`[AI Pipeline] Generated SDXL Prompt: ${generatedPrompt}`)

        // --- STEP 2: Image Generation via Cloudflare SDXL ---
        const cfRes = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${aiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: generatedPrompt,
                    negative_prompt: 'blurry, low quality, dark, noisy, watermark, ugly, distorted, wrong text, bad branding',
                    num_steps: 20,
                    guidance: 7.5,
                    width: 1024,
                    height: 1024,
                }),
            },
        )

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
            prompt_used: generatedPrompt,
            status: 'succeeded',
        })

    } catch (err: any) {
        console.error('[AI Pipeline Error]:', err)
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
    }
}
