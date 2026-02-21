import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { mapToTokopedia, mapToShopee, mapToLazada } from '@/lib/marketplace-mappers'
import type { TokoBLITARProduct } from '@/lib/marketplace-mappers'

// POST: sync products to marketplace
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

    const { platform, product_ids } = await request.json()

    if (!platform) {
        return NextResponse.json({ error: 'platform required' }, { status: 400 })
    }

    // Check connection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: connection } = await (supabase as any)
        .from('marketplace_connections')
        .select('*')
        .eq('store_id', store.id)
        .eq('platform', platform)
        .eq('status', 'connected')
        .single()

    if (!connection) {
        return NextResponse.json({ error: `${platform} belum terhubung` }, { status: 400 })
    }

    // Fetch products to sync
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
        .from('products')
        .select('*, product_images(*)')
        .eq('store_id', store.id)
        .eq('status', 'active')
        .is('deleted_at', null)

    if (product_ids?.length) {
        query = query.in('id', product_ids)
    }

    const { data: products } = await query

    if (!products?.length) {
        return NextResponse.json({ error: 'Tidak ada produk aktif untuk disync' }, { status: 400 })
    }

    // Map and sync each product
    const results = []

    for (const product of products as TokoBLITARProduct[]) {
        let mappedData
        switch (platform) {
            case 'tokopedia': mappedData = mapToTokopedia(product); break
            case 'shopee': mappedData = mapToShopee(product); break
            case 'lazada': mappedData = mapToLazada(product); break
        }

        // In production: call the actual marketplace API with the mapped data
        // For now, record the sync attempt
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
            .from('marketplace_products')
            .upsert({
                product_id: product.id,
                platform,
                external_id: `${platform}_${product.id.slice(0, 8)}`, // Placeholder
                status: 'synced',
                last_synced_at: new Date().toISOString(),
            }, { onConflict: 'product_id,platform' })

        results.push({
            product_id: product.id,
            name: product.name,
            status: 'synced',
        })
    }

    // Update last sync timestamp
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
        .from('marketplace_connections')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('store_id', store.id)
        .eq('platform', platform)

    return NextResponse.json({
        synced: results.length,
        results,
    })
}
