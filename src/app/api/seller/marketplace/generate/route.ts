import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

// POST: Generate platform-specific content using AI + store data
export async function POST(request: Request) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: store } = await (supabase as any)
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .single()

    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

    const { type, platform } = await request.json()
    // type: 'description' | 'categories' | 'bio' | 'hashtags' | 'seo'

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
        return NextResponse.json({ error: 'AI not configured' }, { status: 500 })
    }

    const client = new Anthropic({ apiKey })

    const storeInfo = `
Nama toko: ${store.name}
Deskripsi: ${store.description || 'Toko UMKM di Blitar'}
Alamat: ${store.address || 'Kabupaten Blitar, Jawa Timur'}
Kategori: UMKM / Usaha Kecil
Lokasi: Kabupaten Blitar, Jawa Timur, Indonesia
`

    const prompts: Record<string, Record<string, string>> = {
        'google-maps': {
            description: `Buatkan deskripsi bisnis untuk Google Business Profile berdasarkan data toko ini:\n${storeInfo}\nBuat dalam bahasa Indonesia, maksimal 750 karakter, menarik, profesional, dan mengandung kata kunci yang membantu pencarian Google Maps. Sertakan lokasi Blitar.`,
            categories: `Berdasarkan data toko ini:\n${storeInfo}\nSarankan 3-5 kategori Google Business Profile yang paling relevan. Format: satu kategori per baris, tanpa numbering.`,
            seo: `Buatkan 5 kata kunci SEO untuk Google Business Profile toko ini:\n${storeInfo}\nFormat: satu kata kunci per baris, dalam bahasa Indonesia. Sertakan kata kunci lokal (Blitar).`,
        },
        tokopedia: {
            description: `Buatkan deskripsi toko untuk Tokopedia Seller Center berdasarkan data ini:\n${storeInfo}\nBuat dalam bahasa Indonesia, menarik untuk pembeli online, maksimal 500 karakter. Tekankan keunggulan produk UMKM Blitar.`,
            categories: `Berdasarkan data toko ini:\n${storeInfo}\nSarankan 3 kategori produk Tokopedia yang paling relevan. Format: satu kategori per baris.`,
        },
        shopee: {
            description: `Buatkan deskripsi toko untuk Shopee Seller Centre berdasarkan data ini:\n${storeInfo}\nBuat dalam bahasa Indonesia, friendly dan menarik, maksimal 500 karakter. Cocok untuk pembeli Shopee.`,
            categories: `Berdasarkan data toko ini:\n${storeInfo}\nSarankan 3 kategori produk Shopee yang paling relevan. Format: satu kategori per baris.`,
        },
        lazada: {
            description: `Buatkan deskripsi toko untuk Lazada Seller Center berdasarkan data ini:\n${storeInfo}\nBuat dalam bahasa Indonesia, profesional, maksimal 500 karakter.`,
        },
        instagram: {
            bio: `Buatkan bio Instagram Business yang menarik berdasarkan data toko ini:\n${storeInfo}\nMaksimal 150 karakter. Sertakan emoji yang relevan. Sertakan call-to-action.`,
            hashtags: `Buatkan 15 hashtag Instagram yang relevan untuk toko ini:\n${storeInfo}\nCampuran hashtag populer dan lokal (Blitar). Format: satu baris, dipisahkan spasi.`,
            description: `Buatkan template caption Instagram pertama untuk toko ini:\n${storeInfo}\nBuat caption perkenalan toko, friendly, dengan emoji, dan hashtag di akhir. Maksimal 300 karakter.`,
        },
    }

    const prompt = prompts[platform]?.[type]
    if (!prompt) {
        return NextResponse.json({ error: 'Invalid type/platform' }, { status: 400 })
    }

    try {
        const message = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 500,
            messages: [{ role: 'user', content: prompt }],
        })

        const text = message.content[0].type === 'text' ? message.content[0].text : ''
        return NextResponse.json({ content: text })
    } catch {
        return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
    }
}
