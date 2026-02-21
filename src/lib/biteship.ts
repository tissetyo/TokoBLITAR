import 'server-only'

const BITESHIP_BASE_URL = 'https://api.biteship.com'

function getApiKey() {
    const key = process.env.BITESHIP_API_KEY
    if (!key) throw new Error('BITESHIP_API_KEY not set')
    return key
}

interface BiteshipRateRequest {
    origin_postal_code: string
    destination_postal_code: string
    couriers: string  // comma-separated, e.g. 'jne,jnt,sicepat,anteraja,pos'
    items: {
        name: string
        weight: number  // grams
        quantity: number
        value: number   // price in IDR
    }[]
}

interface BiteshipCourier {
    courier_code: string
    courier_name: string
    courier_service_code: string
    courier_service_name: string
    description: string
    duration: string
    price: number
    type: string
}

interface BiteshipRateResponse {
    success: boolean
    object: string
    message: string
    code: number
    pricing: BiteshipCourier[]
}

export async function getBiteshipRates(params: BiteshipRateRequest): Promise<BiteshipCourier[]> {
    const res = await fetch(`${BITESHIP_BASE_URL}/v1/rates/couriers`, {
        method: 'POST',
        headers: {
            'Authorization': getApiKey(),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            origin_postal_code: params.origin_postal_code,
            destination_postal_code: params.destination_postal_code,
            couriers: params.couriers,
            items: params.items,
        }),
    })

    if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.message || `Biteship API error: ${res.status}`)
    }

    const data: BiteshipRateResponse = await res.json()

    if (!data.success) {
        throw new Error(data.message || 'Gagal mendapatkan tarif pengiriman')
    }

    return data.pricing || []
}

// Fetch available couriers
export async function getBiteshipCouriers() {
    const res = await fetch(`${BITESHIP_BASE_URL}/v1/couriers`, {
        headers: { 'Authorization': getApiKey() },
    })

    if (!res.ok) throw new Error('Failed to fetch couriers')

    return res.json()
}

export type { BiteshipCourier, BiteshipRateRequest }
