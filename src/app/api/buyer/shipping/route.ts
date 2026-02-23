import { NextResponse, type NextRequest } from 'next/server'
import { getBiteshipRates, BiteshipCourier } from '@/lib/biteship'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// GET: fetch shipping rates
export async function GET(request: NextRequest) {
    const url = request.nextUrl
    const originPostal = url.searchParams.get('origin_postal_code') || '66171' // Default: Blitar
    const destPostal = url.searchParams.get('destination_postal_code')
    const weight = parseInt(url.searchParams.get('weight') || '1000')
    const itemValue = parseInt(url.searchParams.get('value') || '50000')
    const storeId = url.searchParams.get('store_id')

    if (!destPostal) {
        return NextResponse.json(
            { error: 'destination_postal_code wajib diisi' },
            { status: 400 },
        )
    }

    if (!storeId) {
        return NextResponse.json(
            { error: 'store_id wajib diisi' },
            { status: 400 },
        )
    }

    try {
        const supabase = await createSupabaseServerClient()

        // Get store's allowed couriers
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: store } = await (supabase as any)
            .from('stores')
            .select('shipping_couriers')
            .eq('id', storeId)
            .single()

        const allowedCouriers = store?.shipping_couriers || ['jne', 'jnt', 'sicepat', 'anteraja', 'pos', 'tiki']

        let rates = await getBiteshipRates({
            origin_postal_code: originPostal,
            destination_postal_code: destPostal,
            couriers: allowedCouriers.join(','),
            items: [{
                name: 'Produk',
                weight,
                quantity: 1,
                value: itemValue,
            }],
        })

        // Extra filtering just in case Biteship returns unrequested couriers
        rates = rates.filter((r: BiteshipCourier) => allowedCouriers.includes(r.courier_code.toLowerCase()))

        return NextResponse.json({ rates })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Gagal mendapatkan tarif'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
