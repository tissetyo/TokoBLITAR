import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const orderSchema = z.object({
    items: z.array(z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().positive(),
    })).min(1),
    shipping_address: z.object({
        name: z.string().min(1),
        phone: z.string().min(1),
        street: z.string().min(1),
        city: z.string().optional(),
        province: z.string().optional(),
        postal_code: z.string().optional(),
    }),
    shipping: z.object({
        courier: z.string(),
        cost: z.number().nonnegative(),
        duration: z.string(),
    }),
    promo_code: z.string().optional(),
})

export async function POST(request: Request) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = orderSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ error: 'Data tidak valid', details: parsed.error.flatten() }, { status: 400 })
    }

    const { items, shipping_address, shipping } = parsed.data

    try {
        // Fetch product prices and store_id
        const productIds = items.map((i) => i.product_id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: products } = await (supabase as any)
            .from('products')
            .select('id, price, stock, store_id')
            .in('id', productIds)
            .eq('status', 'active')

        if (!products || products.length !== items.length) {
            return NextResponse.json({ error: 'Beberapa produk tidak tersedia' }, { status: 400 })
        }

        // Calculate totals
        const storeId = products[0].store_id
        let totalAmount = 0
        const orderItems = items.map((item) => {
            const product = products.find((p: { id: string }) => p.id === item.product_id)
            if (!product) throw new Error('Product not found')
            if (product.stock < item.quantity) throw new Error(`Stok ${product.id} tidak cukup`)

            const subtotal = product.price * item.quantity
            totalAmount += subtotal

            return {
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: product.price,
                subtotal,
            }
        })

        // Add shipping cost to grand total
        totalAmount += shipping.cost

        // Create order
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: order, error: orderError } = await (supabase as any)
            .from('orders')
            .insert({
                buyer_id: user.id,
                store_id: storeId,
                status: 'pending',
                total_amount: totalAmount,
                discount_amount: 0,
                source: 'web',
                shipping_address: {
                    ...shipping_address,
                    courier: shipping.courier,
                    shipping_cost: shipping.cost,
                    duration: shipping.duration
                },
            })
            .select()
            .single()

        if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 })

        // Create order items
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
            .from('order_items')
            .insert(orderItems.map((item) => ({ ...item, order_id: order.id })))

        // Decrement stock
        for (const item of items) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any).rpc('decrement_stock', {
                p_product_id: item.product_id,
                p_quantity: item.quantity,
            })
        }

        return NextResponse.json({ order }, { status: 201 })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Terjadi kesalahan'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
