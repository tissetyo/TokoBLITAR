import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Enhance a product photo:
// 1. Use Groq/Gemini to describe the product from user's product name
// 2. Use Cloudflare SDXL to generate a professional photo
export async function POST(request: Request) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
    const aiToken = process.env.CLOUDFLARE_AI_TOKEN
    if (!accountId || !aiToken) {
        return NextResponse.json({ error: 'Cloudflare AI belum di-set' }, { status: 503 })
    }

    let body
    try { body = await request.json() } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { product_name, product_description, action } = body
    if (!product_name) {
        return NextResponse.json({ error: 'product_name is required' }, { status: 400 })
    }

    try {
        let prompt = ''

        if (action === 'remove_bg' || action === 'enhance') {
            prompt = `professional product photo of ${product_name}, ${product_description || 'high quality product'}, isolated on pure white background, studio lighting, soft shadows, centered composition, commercial product photography, sharp focus, high resolution, no text, no watermark, clean minimal style`
        } else if (action === 'upscale') {
            prompt = `ultra detailed close-up product photo of ${product_name}, ${product_description || 'premium product'}, macro photography, extreme detail and sharpness, professional studio lighting, white background, 8K resolution, commercial advertising quality, no text`
        } else if (action === 'lifestyle') {
            prompt = `lifestyle product photo of ${product_name}, ${product_description || 'beautiful product'}, in natural setting, warm ambient lighting, aesthetic composition, instagram worthy, professional photography, bokeh background, cozy atmosphere, no text, no watermark`
        } else {
            return NextResponse.json({ error: `Action "${action}" tidak dikenali` }, { status: 400 })
        }

        console.log(`[enhance] action=${action}, prompt=${prompt.slice(0, 80)}...`)

        const cfRes = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${aiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    negative_prompt: 'blurry, low quality, dark, noisy, watermark, ugly, distorted, text, logo, banner, collage, multiple items, hands, fingers',
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
            return NextResponse.json({ error: 'Gagal generate foto profesional' }, { status: 500 })
        }

        const imageBuffer = await cfRes.arrayBuffer()
        const base64 = Buffer.from(imageBuffer).toString('base64')
        return NextResponse.json({ result: `data:image/png;base64,${base64}` })
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[enhance] Error:', msg)
        return NextResponse.json({ error: `Gagal: ${msg}` }, { status: 500 })
    }
}
