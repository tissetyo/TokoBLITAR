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

    const { image_base64, action, product_name } = body
    if (!image_base64) {
        return NextResponse.json({ error: 'image_base64 is required' }, { status: 400 })
    }

    try {
        console.log(`[enhance] Starting enhancement. Action: ${action}`)

        // Only support these actions
        if (!['remove_bg', 'enhance', 'studio_background'].includes(action)) {
            return NextResponse.json({ error: 'Aksi tidak didukung. Gunakan Hapus BG, Full Enhance, atau Studio Background.' }, { status: 400 })
        }

        // Clean base64 string
        const base64Data = image_base64.includes(',') ? image_base64.split(',')[1] : image_base64
        const imageBuffer = Buffer.from(base64Data, 'base64')

        if (action === 'studio_background') {
            const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
            const aiToken = process.env.CLOUDFLARE_AI_TOKEN

            if (!accountId || !aiToken) {
                return NextResponse.json({ error: 'Layanan AI belum dikonfigurasi sepenuhnya (Butuh Cloudflare API Key)' }, { status: 503 })
            }

            console.log(`[enhance] Calling Cloudflare Llama 3.2 Vision for Image Analysis...`)

            const visionPrompt = `
            Analyze this product image carefully.
            Write a highly detailed text-to-image prompt (Midjourney style) to recreate this exact product in a professional, aesthetic studio setting.
            Describe the exact shape, color, typography, and recognizable branding of the main object you see.
            Place it on a premium aesthetic background (e.g. marble table, wooden desk, soft pastel backdrop, or nature setting depending on context).
            Use dramatic studio lighting, sharp focus, 8k resolution, photorealistic.
            ONLY Output the prompt text, nothing else. No intro, no markdown. 
            Focus strictly on making the main product look identical to the one in the photo.
            ${product_name ? `Product context name: ${product_name}` : ''}
            `

            let generatedPrompt = ''
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
                const errText = await llamaRes.text().catch(() => "Unknown error")

                // --- HANDLE CLOUDFLARE META LLAMA 3.2 LICENSE AGREEMENT ---
                if (errText.includes('5016') && errText.includes('agree')) {
                    console.log("[enhance] Cloudflare requires Meta Llama 3.2 License Agreement. Auto-accepting...");
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
                        console.log("[enhance] License accepted! Retrying image analysis...");
                        // Retry the original request
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

                        // Replace the main response string with the retry successful one
                        const retryData = await retryRes.json().catch(() => ({}))
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const retryGeneratedPrompt = (retryData as any).choices?.[0]?.message?.content?.trim()
                        if (!retryGeneratedPrompt) throw new Error("Cloudflare Llama mengembalikan prompt kosong setelah retry")

                        generatedPrompt = retryGeneratedPrompt;
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

            if (!generatedPrompt) throw new Error("Cloudflare Llama mengembalikan prompt kosong")

            console.log(`[enhance] Generated SDXL Prompt: ${generatedPrompt}`)

            console.log(`[enhance] Calling Cloudflare SDXL for Generation...`)
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
                        negative_prompt: 'blurry, low quality, dark, noisy, watermark, ugly, distorted, wrong text, bad branding, deformed',
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
                throw new Error('Gagal melakukan render gambar di Cloudflare SDXL')
            }

            const cfImageBuffer = await cfRes.arrayBuffer()
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
