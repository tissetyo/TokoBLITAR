import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

// GET: fetch single order for a seller
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch order if it belongs to seller's store
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error } = await (supabase as any)
        .from('orders')
        .select(`
            *,
            order_items (
                id,
                quantity,
                unit_price,
                subtotal,
                products ( name )
            ),
            users!buyer_id ( email, raw_user_meta_data )
        `)
        .eq('id', id)
        .single()

    if (error || !order) {
        return NextResponse.json({ error: error?.message || 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ order })
}

const updateSchema = z.object({
    status: z.enum(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).optional(),
    shipping_tracking_code: z.string().optional()
})

// PATCH: update order status or tracking code
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
        return NextResponse.json({ error: 'Data tidak valid', details: parsed.error.flatten() }, { status: 400 })
    }

    // Update order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error } = await (supabase as any)
        .from('orders')
        .update(parsed.data)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ order })
}
