import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

// POST: enhance a product photo using Cloudflare Workers AI
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

    const { prompt } = await request.json()

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
    const aiToken = process.env.CLOUDFLARE_AI_TOKEN
    if (!accountId || !aiToken) {
        return NextResponse.json({ error: 'Cloudflare AI not configured' }, { status: 503 })
    }

    const enhancePrompt = prompt || `professional product photography of ${product.name}, studio lighting, white background, sharp focus, high resolution, commercial photography, premium quality`

    try {
        // Use Cloudflare Workers AI — Stable Diffusion XL
        const cfRes = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${aiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: enhancePrompt,
                    negative_prompt: 'blurry, low quality, dark, noisy, watermark, ugly, distorted',
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
            return NextResponse.json(
                { error: 'Image generation failed' },
                { status: 500 },
            )
        }

        // Cloudflare returns raw image bytes
        const imageBuffer = await cfRes.arrayBuffer()
        const base64 = Buffer.from(imageBuffer).toString('base64')
        const dataUrl = `data:image/png;base64,${base64}`

        return NextResponse.json({
            image_url: dataUrl,
            status: 'succeeded',
        })
    } catch (err) {
        console.error('AI enhancement error:', err)
        return NextResponse.json({ error: 'AI service error' }, { status: 500 })
    }
}
