import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const promoSchema = z.object({
    code: z.string().min(3).max(20),
    discount_percent: z.number().min(1).max(100),
    min_order_amount: z.number().min(0).default(0),
    max_uses: z.number().int().min(1).optional(),
    valid_until: z.string(), // ISO date
    is_active: z.boolean().default(true),
})

// GET: list seller's promo codes
export async function GET() {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: store } = await (supabase as any)
        .from('stores').select('id').eq('user_id', user.id).single()
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: promos } = await (supabase as any)
        .from('promo_codes')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })

    return NextResponse.json({ promos: promos || [] })
}

// POST: create promo code
export async function POST(request: Request) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: store } = await (supabase as any)
        .from('stores').select('id').eq('user_id', user.id).single()
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

    const body = await request.json()
    const parsed = promoSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
        .from('promo_codes')
        .insert({ ...parsed.data, store_id: store.id, code: parsed.data.code.toUpperCase() })
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ promo: data }, { status: 201 })
}

// PUT: update promo (toggle active)
export async function PUT(request: Request) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: store } = await (supabase as any)
        .from('stores').select('id').eq('user_id', user.id).single()
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

    const { id, ...updates } = await request.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
        .from('promo_codes')
        .update(updates)
        .eq('id', id)
        .eq('store_id', store.id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ promo: data })
}

// DELETE: delete promo
export async function DELETE(request: NextRequest) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: store } = await (supabase as any)
        .from('stores').select('id').eq('user_id', user.id).single()
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

    const id = request.nextUrl.searchParams.get('id')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('promo_codes').delete().eq('id', id).eq('store_id', store.id)

    return NextResponse.json({ success: true })
}
