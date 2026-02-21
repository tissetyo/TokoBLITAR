import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// GET: list all products (admin)
export async function GET() {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
        .from('users').select('role').eq('id', user.id).single()
    if ((profile as { role: string } | null)?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: products } = await (supabase as any)
        .from('products')
        .select('*, stores(name)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(100)

    return NextResponse.json({ products: products || [] })
}

// PUT: update product (feature toggle)
export async function PUT(request: Request) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
        .from('users').select('role').eq('id', user.id).single()
    if ((profile as { role: string } | null)?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, ...updates } = await request.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
        .from('products').update(updates).eq('id', id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ product: data })
}

// DELETE: soft delete product
export async function DELETE(request: NextRequest) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
        .from('users').select('role').eq('id', user.id).single()
    if ((profile as { role: string } | null)?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const id = request.nextUrl.searchParams.get('id')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
        .from('products')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

    return NextResponse.json({ success: true })
}
