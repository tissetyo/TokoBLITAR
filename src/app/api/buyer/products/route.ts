import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// GET: public product listing with search, filter, pagination
export async function GET(request: NextRequest) {
    const supabase = await createSupabaseServerClient()
    const url = request.nextUrl

    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '12')
    const q = url.searchParams.get('q')
    const categoryId = url.searchParams.get('category_id')
    const priceMin = url.searchParams.get('price_min')
    const priceMax = url.searchParams.get('price_max')
    const storeId = url.searchParams.get('store_id')
    const featured = url.searchParams.get('featured')
    const offset = (page - 1) * limit

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
        .from('products')
        .select('*, product_images(*), stores(name, slug)', { count: 'exact' })
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (q) query = query.ilike('name', `%${q}%`)
    if (categoryId) query = query.eq('category_id', categoryId)
    if (priceMin) query = query.gte('price', parseInt(priceMin))
    if (priceMax) query = query.lte('price', parseInt(priceMax))
    if (storeId) query = query.eq('store_id', storeId)
    if (featured === 'true') query = query.eq('is_featured', true)

    const { data: products, count, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
        products,
        pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
        },
    })
}
