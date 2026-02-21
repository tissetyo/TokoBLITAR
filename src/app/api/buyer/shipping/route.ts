import { NextResponse, type NextRequest } from 'next/server'
import { getBiteshipRates } from '@/lib/biteship'

// GET: fetch shipping rates
export async function GET(request: NextRequest) {
    const url = request.nextUrl
    const originPostal = url.searchParams.get('origin_postal_code') || '66171' // Default: Blitar
    const destPostal = url.searchParams.get('destination_postal_code')
    const weight = parseInt(url.searchParams.get('weight') || '1000')
    const itemValue = parseInt(url.searchParams.get('value') || '50000')

    if (!destPostal) {
        return NextResponse.json(
            { error: 'destination_postal_code wajib diisi' },
            { status: 400 },
        )
    }

    try {
        const rates = await getBiteshipRates({
            origin_postal_code: originPostal,
            destination_postal_code: destPostal,
            couriers: 'jne,jnt,sicepat,anteraja,pos,tiki',
            items: [{
                name: 'Produk',
                weight,
                quantity: 1,
                value: itemValue,
            }],
        })

        return NextResponse.json({ rates })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Gagal mendapatkan tarif'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
