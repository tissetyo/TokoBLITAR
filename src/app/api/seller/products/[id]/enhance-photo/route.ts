import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

// POST: enhance a product photo using AI
export async function POST(request: Request, { params }: Params) {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify product ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: product } = await (supabase as any)
        .from('products')
        .select('id, stores!inner(user_id)')
        .eq('id', id)
        .single()

    if (!product || product.stores.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { image_url, prompt } = await request.json()

    if (!image_url) {
        return NextResponse.json({ error: 'image_url is required' }, { status: 400 })
    }

    const replicateToken = process.env.REPLICATE_API_TOKEN
    if (!replicateToken) {
        return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
    }

    try {
        // Call Replicate API for image enhancement
        const replicateRes = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${replicateToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                version: 'a4a8bafd6089e1716b06057c42b19378250d008b80fe87caa5cd36d40c1eda90',
                input: {
                    image: image_url,
                    prompt: prompt || 'high quality product photo, professional lighting, white background, sharp focus, commercial photography',
                    negative_prompt: 'blurry, low quality, dark, noisy, watermark',
                    num_inference_steps: 20,
                    guidance_scale: 7.5,
                },
            }),
        })

        const prediction = await replicateRes.json()

        if (!replicateRes.ok) {
            return NextResponse.json(
                { error: prediction.detail || 'AI enhancement failed' },
                { status: 500 },
            )
        }

        // Return the prediction ID — client will poll for result
        return NextResponse.json({
            prediction_id: prediction.id,
            status: prediction.status,
        })
    } catch {
        return NextResponse.json({ error: 'AI service error' }, { status: 500 })
    }
}
