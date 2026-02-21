import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// GET: list all stores (admin)
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
    const { data: stores } = await (supabase as any)
        .from('stores')
        .select('*, users(full_name, email)')
        .order('created_at', { ascending: false })

    return NextResponse.json({ stores: stores || [] })
}

// PUT: update store (feature toggle, etc.)
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
        .from('stores').update(updates).eq('id', id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ store: data })
}
