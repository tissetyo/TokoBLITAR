import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const productSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    price: z.number().positive(),
    stock: z.number().int().min(0).default(0),
    weight_gram: z.number().int().min(0).default(0),
    category_id: z.string().uuid().optional().nullable(),
    status: z.enum(['active', 'draft', 'archived']).default('draft'),
    is_featured: z.boolean().default(false),
    images: z.array(z.object({
        url: z.string(),
        is_primary: z.boolean().default(false),
        is_ai_enhanced: z.boolean().default(false),
        sort_order: z.number().int().default(0),
    })).optional(),
})

// GET: paginated product list for the seller
export async function GET(request: NextRequest) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get seller's store
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: store } = await (supabase as any)
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single()

    if (!store) return NextResponse.json({ error: 'Toko belum dibuat' }, { status: 404 })

    const url = request.nextUrl
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const status = url.searchParams.get('status')
    const search = url.searchParams.get('q')
    const offset = (page - 1) * limit

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
        .from('products')
        .select('*, product_images(*)', { count: 'exact' })
        .eq('store_id', store.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (status) query = query.eq('status', status)
    if (search) query = query.ilike('name', `%${search}%`)

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

// POST: create a new product
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

    if (!store) return NextResponse.json({ error: 'Toko belum dibuat' }, { status: 404 })

    const body = await request.json()
    const parsed = productSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ error: 'Data tidak valid', details: parsed.error.flatten() }, { status: 400 })
    }

    const { images, ...productData } = parsed.data

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: product, error } = await (supabase as any)
        .from('products')
        .insert({ ...productData, store_id: store.id })
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Insert images if provided
    if (images && images.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
            .from('product_images')
            .insert(images.map((img: { url: string; is_primary: boolean; is_ai_enhanced: boolean; sort_order: number }) => ({
                ...img,
                product_id: product.id,
            })))
    }

    return NextResponse.json({ product }, { status: 201 })
}
