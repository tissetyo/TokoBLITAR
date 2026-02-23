import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const storeSchema = z.object({
    name: z.string().min(3),
    slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
    logo_url: z.string().optional(),
    banner_url: z.string().optional(),
    description: z.string().optional(),
    address: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    google_maps_url: z.string().optional(),
    instagram_handle: z.string().optional(),
    shipping_couriers: z.array(z.string()).optional(),
})

// GET: fetch seller's store or check slug availability
export async function GET(request: NextRequest) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check slug availability
    const checkSlug = request.nextUrl.searchParams.get('check_slug')
    if (checkSlug) {
        const { data } = await supabase
            .from('stores')
            .select('id')
            .eq('slug', checkSlug)
            .maybeSingle()

        return NextResponse.json({ available: !data })
    }

    // Fetch seller's store
    const { data: store, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ store })
}

// PUT: create or update seller's store
export async function PUT(request: Request) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = storeSchema.safeParse(body)

    if (!parsed.success) {
        return NextResponse.json(
            { error: 'Data tidak valid', details: parsed.error.flatten() },
            { status: 400 },
        )
    }

    // Check if store already exists
    const { data: existingStore } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (existingStore) {
        // Update
        const existingId = (existingStore as { id: string }).id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: store, error } = await (supabase as any)
            .from('stores')
            .update(parsed.data)
            .eq('id', existingId)
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ store })
    } else {
        // Create
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: store, error } = await (supabase as any)
            .from('stores')
            .insert({ ...parsed.data, user_id: user.id })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ store }, { status: 201 })
    }
}
