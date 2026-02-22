import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

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

    const { image_base64, action } = body
    if (!image_base64) {
        return NextResponse.json({ error: 'image_base64 is required' }, { status: 400 })
    }

    try {
        // --- STEP 1: Use Gemini Vision to describe the product ---
        console.log(`[enhance] Step 1: Requesting Gemini Vision analysis...`)
        const genAI = new GoogleGenerativeAI(geminiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })

        // Extract raw base64 data (remove data:image/png;base64, prefix if present)
        const base64Data = image_base64.includes(',') ? image_base64.split(',')[1] : image_base64

        const visionPrompt = `Analyze this product photo. Describe the main product exactly as it looks in extreme detail:
- Shape, form, and material
- Primary and secondary colors
- Any prominent text, labels, or branding details visible
- Unique defining physical features
Write the response as a continuous string of comma-separated keywords and short phrases, perfect for an AI image generator prompt to recreate this exact item.
Do NOT include any introductory or concluding text. English language only.`

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: 'image/jpeg'
            }
        }

        const visionResult = await model.generateContent([visionPrompt, imagePart])
        let productDescription = visionResult.response.text().trim()

        // Sanitize the description
        productDescription = productDescription.replace(/^Here is.*:/i, '').replace(/\n/g, ' ').trim()
        console.log(`[enhance] Gemini description: ${productDescription.slice(0, 100)}...`)

        if (!productDescription) {
            throw new Error('Gemini failed to generate description')
        }

        // --- STEP 2: Use Cloudflare SDXL to generate the enhanced photo ---
        console.log(`[enhance] Step 2: Generating photo via Cloudflare... action=${action}`)
        let sdPrompt = ''
        let sdNegative = 'blurry, low quality, dark, noisy, watermark, ugly, distorted, collage, multiple items, human hands, fingers, bad anatomy, bad lighting, text, text overlay, signature'

        if (action === 'remove_bg' || action === 'enhance') {
            sdPrompt = `professional commercial product photography of [${productDescription}], perfectly centered, isolated on pure white background, soft studio lighting, sharp focus, 8k resolution, high-end product display, clean minimalist look`
        } else if (action === 'upscale') {
            sdPrompt = `hyper-realistic extreme macro close-up of [${productDescription}], incredible texture, 8k resolution, highly detailed, dramatic lighting, sharp focus, premium quality`
            sdNegative += ', zoomed out, tiny'
        } else if (action === 'lifestyle' || action === 'background') {
            sdPrompt = `beautiful lifestyle product photography of [${productDescription}], placed naturally in a stunning aesthetic environment, warm natural lighting, shallow depth of field (bokeh), instagram worthy, professional styling, highly detailed`
        } else {
            sdPrompt = `professional photo of [${productDescription}], high quality, 8k`
        }

        const cfRes = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${cfToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: sdPrompt,
                    negative_prompt: sdNegative,
                    num_steps: 25,
                    guidance: 7.5,
                    width: 1024,
                    height: 1024,
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
