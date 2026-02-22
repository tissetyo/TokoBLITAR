import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { GoogleGenAI } from '@google/genai'

// Flow:
// 1. Send uploaded raw photo to Gemini Vision to get a detailed description prompt
// 2. Send that description to Cloudflare SDXL to generate a professional photo
export async function POST(request: Request) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check API Keys
    const geminiKey = process.env.GEMINI_API_KEY
    if (!geminiKey) return NextResponse.json({ error: 'GEMINI_API_KEY belum di-set' }, { status: 503 })

    const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID
    const cfToken = process.env.CLOUDFLARE_AI_TOKEN
    if (!cfAccountId || !cfToken) return NextResponse.json({ error: 'Cloudflare AI config belum di-set' }, { status: 503 })

    let body
    try { body = await request.json() } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { image_base64, action, product_name, product_description } = body
    if (!image_base64) {
        return NextResponse.json({ error: 'image_base64 is required' }, { status: 400 })
    }

    try {
        let sdPrompt = ''
        let productDescriptionText = ''

        // Extract raw base64 data
        const base64Data = image_base64.includes(',') ? image_base64.split(',')[1] : image_base64

        // --- STEP 1: Get product physical description ---
        try {
            console.log(`[enhance] Step 1: Requesting Gemini Vision analysis...`)

            // API Key Rotation Logic
            const geminiKeysStr = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || ''
            const geminiKeys = geminiKeysStr.split(',').map(k => k.trim()).filter(Boolean)

            if (geminiKeys.length === 0) {
                throw new Error('Tidak ada GEMINI_API_KEY yang tersedia')
            }

            // Pick a random key to distribute the load
            const randomKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)]
            console.log(`[enhance] Menggunakan Gemini API Key ke-${geminiKeys.indexOf(randomKey) + 1} dari ${geminiKeys.length} keys aktif`)

            const ai = new GoogleGenAI({ apiKey: randomKey })

            const visionPrompt = `Analyze this product photo. Describe the main product exactly as it looks in extreme detail:
- Shape, form, and material
- Primary and secondary colors
- Any prominent text, labels, or branding details visible
- Unique defining physical features
Write the response as a continuous string of comma-separated keywords and short phrases, perfect for an AI image generator prompt to recreate this exact item.
Do NOT include any introductory or concluding text. English language only.`

            const imagePart = {
                inlineData: { data: base64Data, mimeType: 'image/jpeg' }
            }

            const visionResult = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [visionPrompt, imagePart]
            })

            productDescriptionText = visionResult.text?.trim() || ''
            productDescriptionText = productDescriptionText.replace(/^Here is.*:/i, '').replace(/\n/g, ' ').trim()
            console.log(`[enhance] Gemini description: ${productDescriptionText.slice(0, 100)}...`)
        } catch (geminiErr) {
            console.warn('[enhance] Gemini failed/rate-limited. Falling back to Groq text description.', geminiErr)

            // Fallback: If Gemini fails (e.g. rate limit), use Groq with the product name as fallback
            const groqKey = process.env.GROQ_API_KEY
            if (groqKey && product_name) {
                const groqPrompt = `Write a highly detailed physical description of a product named "${product_name}" (Description: ${product_description || 'None'}).
Describe its standard likely appearance, shape, colors, and materials.
Write the response as a continuous string of comma-separated keywords and short phrases, perfect for an AI image generator prompt.
English language only. No intro, no outro.`

                const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'llama-3.3-70b-versatile',
                        messages: [{ role: 'user', content: groqPrompt }],
                        max_tokens: 200,
                    }),
                })

                if (res.ok) {
                    const data = await res.json()
                    productDescriptionText = data.choices[0].message.content.trim()
                    console.log(`[enhance] Groq fallback description: ${productDescriptionText.slice(0, 100)}...`)
                }
            }

            // Ultimate fallback if both AI APIs fail
            if (!productDescriptionText) {
                productDescriptionText = product_name || 'commercial product'
                console.log(`[enhance] Ultimate fallback to product name: ${productDescriptionText}`)
            }
        }

        // --- STEP 2: Use Cloudflare SDXL to generate the enhanced photo ---
        console.log(`[enhance] Step 2: Generating photo via Cloudflare... action=${action}`)
        let sdNegative = 'blurry, low quality, dark, noisy, watermark, ugly, distorted, collage, multiple items, human hands, fingers, bad anatomy, bad lighting, text, text overlay, signature'

        if (action === 'remove_bg' || action === 'enhance') {
            sdPrompt = `professional commercial product photography of [${productDescriptionText}], perfectly centered, isolated on pure white background, soft studio lighting, sharp focus, 8k resolution, high-end product display, clean minimalist look`
        } else if (action === 'upscale') {
            sdPrompt = `hyper-realistic extreme macro close-up of [${productDescriptionText}], incredible texture, 8k resolution, highly detailed, dramatic lighting, sharp focus, premium quality`
            sdNegative += ', zoomed out, tiny'
        } else if (action === 'lifestyle' || action === 'background') {
            sdPrompt = `beautiful lifestyle product photography of [${productDescriptionText}], placed naturally in a stunning aesthetic environment, warm natural lighting, shallow depth of field (bokeh), instagram worthy, professional styling, highly detailed`
        } else {
            sdPrompt = `professional photo of [${productDescriptionText}], high quality, 8k`
        }

        const cfRes = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/runwayml/stable-diffusion-v1-5-img2img`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${cfToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: sdPrompt,
                    negative_prompt: sdNegative,
                    image_b64: base64Data, // Stable Diffusion v1.5 img2img specific
                    strength: action === 'upscale' ? 0.3 : 0.6,
                    num_steps: 20,
                    guidance: 7.5,
                }),
            },
        )

        if (!cfRes.ok) {
            const err = await cfRes.json().catch(() => ({}))
            console.error('[enhance] Cloudflare error:', JSON.stringify(err).slice(0, 300))
            throw new Error(err?.errors?.[0]?.message || 'Gagal generate SDXL')
        }

        const cfBuffer = await cfRes.arrayBuffer()
        const resultBase64 = Buffer.from(cfBuffer).toString('base64')

        return NextResponse.json({ result: `data:image/png;base64,${resultBase64}` })

    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[enhance] Error:', msg)
        return NextResponse.json({ error: `Gagal memproses gambar: ${msg}` }, { status: 500 })
    }
}
