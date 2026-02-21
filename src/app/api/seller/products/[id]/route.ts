import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const updateSchema = z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    stock: z.number().int().min(0).optional(),
    weight_gram: z.number().int().min(0).optional(),
    category_id: z.string().uuid().optional().nullable(),
    status: z.enum(['active', 'draft', 'archived']).optional(),
    is_featured: z.boolean().optional(),
})

type Params = { params: Promise<{ id: string }> }

// GET: single product
export async function GET(_request: Request, { params }: Params) {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: product, error } = await (supabase as any)
        .from('products')
        .select('*, product_images(*), stores!inner(user_id)')
        .eq('id', id)
        .is('deleted_at', null)
        .single()

    if (error || !product) {
        return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }

    // Verify ownership
    if (product.stores.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ product })
}

// PUT: update product
export async function PUT(request: Request, { params }: Params) {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ error: 'Data tidak valid', details: parsed.error.flatten() }, { status: 400 })
    }

    // Verify ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
        .from('products')
        .select('id, stores!inner(user_id)')
        .eq('id', id)
        .is('deleted_at', null)
        .single()

    if (!existing || existing.stores.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: product, error } = await (supabase as any)
        .from('products')
        .update(parsed.data)
        .eq('id', id)
        .select('*, product_images(*)')
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ product })
}

// DELETE: soft delete
export async function DELETE(_request: Request, { params }: Params) {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
        .from('products')
        .select('id, stores!inner(user_id)')
        .eq('id', id)
        .is('deleted_at', null)
        .single()

    if (!existing || existing.stores.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
        .from('products')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ message: 'Produk dihapus' })
}
