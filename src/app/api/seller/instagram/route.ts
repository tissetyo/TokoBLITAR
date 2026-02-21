import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// POST: create/schedule an Instagram post
export async function POST(request: Request) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: store } = await (supabase as any)
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single()

    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

    const { caption, image_url, product_id, scheduled_at } = await request.json()

    if (!caption || !image_url) {
        return NextResponse.json({ error: 'caption dan image_url wajib diisi' }, { status: 400 })
    }

    try {
        // In production: call Instagram Graph API for immediate publish
        // For now, save as draft/scheduled post
        const status = scheduled_at ? 'scheduled' : 'draft'

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: post, error } = await (supabase as any)
            .from('instagram_posts')
            .insert({
                store_id: store.id,
                product_id: product_id || null,
                caption,
                image_url,
                status,
                scheduled_at: scheduled_at || null,
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ post }, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }
}

// GET: list Instagram posts
export async function GET() {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: store } = await (supabase as any)
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single()

    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: posts } = await (supabase as any)
        .from('instagram_posts')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })
        .limit(20)

    return NextResponse.json({ posts: posts || [] })
}
