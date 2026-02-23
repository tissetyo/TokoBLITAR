import { NextResponse, type NextRequest } from 'next/server'
import { getBiteshipRates } from '@/lib/biteship'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// GET: fetch manual shipping rates for seller dashboard
export async function GET(request: NextRequest) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = request.nextUrl
    const originPostal = url.searchParams.get('origin_postal_code')
    const destPostal = url.searchParams.get('destination_postal_code')
    const weight = parseInt(url.searchParams.get('weight') || '1000')
    const couriers = url.searchParams.get('couriers') || 'jne,jnt,sicepat,anteraja,pos,tiki'

    // Parse items if provided, otherwise default to a generic item
    let items
    try {
        const itemsParam = url.searchParams.get('items')
        if (itemsParam) {
            items = JSON.parse(itemsParam)
        }
    } catch {
        // Fallback
    }

    if (!items || !Array.isArray(items)) {
        items = [{
            name: 'Paket Reguler',
            weight,
            quantity: 1,
            value: 50000,
        }]
    }

    if (!originPostal || !destPostal) {
        return NextResponse.json(
            { error: 'Kodepos asal dan tujuan wajib diisi' },
            { status: 400 },
        )
    }

    try {
        const rates = await getBiteshipRates({
            origin_postal_code: originPostal,
            destination_postal_code: destPostal,
            couriers,
            items,
        })

        return NextResponse.json({ rates })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Gagal mengecek tarif ongkos kirim'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
