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
        const { image_url, visionModel = '@cf/llava-hf/llava-1.5-7b-hf' } = body

        if (!image_url && !imageBase64) { // Added check for imageBase64 as well
            return NextResponse.json({ error: 'Image URL or Base64 is required' }, { status: 400 })
        }

        // Re-declare accountId and aiToken if they were not already defined, or ensure they are used from the outer scope
        const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
        const aiToken = process.env.CLOUDFLARE_AI_TOKEN

        if (!accountId || !aiToken) {
            return NextResponse.json({ error: 'AI Services not configured' }, { status: 503 })
        }

        let base64Data: string;
        if (image_url) {
            // 1. Fetch the actual image from the bucket to get base64
            const imgRes = await fetch(image_url)
            const arrayBuffer = await imgRes.arrayBuffer()
            base64Data = Buffer.from(arrayBuffer).toString('base64')
        } else {
            // Strip the data:image prefix if present to get raw base64
            base64Data = imageBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, "")
        }

        // 2. Vision Reasoning
        const visionPrompt = `
        Analyze this product image carefully.
        Describe ONLY the main product object in extreme detail:
        its shape, color, material, key features, and current angle.
        Do not describe the background, people, or any text.
        ONLY Output the prompt text, nothing else. No intro, no markdown.
        Focus strictly on making the main product look identical to the one in the photo.
        ${customPrompt ? `Additional user instruction: ${customPrompt}` : `Product context name: ${product.name}`}
        `

        let generatedPrompt = ''
        console.log(`[AI Pipeline] Calling Cloudflare Vision Model (${visionModel}) for Image Analysis...`)

        const llamaRes = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${aiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: visionModel,
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
            const errText = await llamaRes.text().catch(() => "Unknown error")

            // --- HANDLE CLOUDFLARE META LLAMA 3.2 LICENSE AGREEMENT ---
            if (errText.includes('5016') && errText.includes('agree')) {
                console.log("[AI Pipeline] Cloudflare requires Meta Llama 3.2 License Agreement. Auto-accepting...");
                const agreeRes = await fetch(
                    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${aiToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            prompt: 'agree'
                        })
                    }
                );

                if (agreeRes.ok) {
                    console.log("[AI Pipeline] License accepted! Retrying image analysis...");
                    // Retry original image reasoning
                    const retryRes = await fetch(
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
                    );

                    if (!retryRes.ok) {
                        throw new Error(`Cloudflare API Error after retry: ${await retryRes.text()}`)
                    }

                    const retryData = await retryRes.json().catch(() => ({}))
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    generatedPrompt = (retryData as any).choices?.[0]?.message?.content?.trim()
                } else {
                    throw new Error(`Gagal menyetujui lisensi Llama: ${await agreeRes.text()}`)
                }
            } else {
                console.error('Cloudflare Vision AI error:', errText)
                throw new Error(`Cloudflare API Error: ${errText}`)
            }
        } else {
            const llamaData = await llamaRes.json().catch(() => ({}))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            generatedPrompt = (llamaData as any).choices?.[0]?.message?.content?.trim()
        }

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
