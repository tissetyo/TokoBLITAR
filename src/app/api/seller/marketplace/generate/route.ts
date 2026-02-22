import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { GoogleGenAI } from '@google/genai'

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

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        return NextResponse.json({ error: 'AI not configured. Set GEMINI_API_KEY.' }, { status: 500 })
    }

    const ai = new GoogleGenAI({ apiKey })

    const storeInfo = `
Nama toko: ${store.name}
Deskripsi: ${store.description || 'Toko UMKM di Blitar'}
Alamat: ${store.address || 'Kabupaten Blitar, Jawa Timur'}
Kategori: UMKM / Usaha Kecil
Lokasi: Kabupaten Blitar, Jawa Timur, Indonesia
`

    const prompts: Record<string, Record<string, string>> = {
        'google-maps': {
            description: `Buatkan deskripsi bisnis untuk Google Business Profile berdasarkan data toko ini:\n${storeInfo}\nBuat dalam bahasa Indonesia, maksimal 750 karakter, menarik, profesional, dan mengandung kata kunci yang membantu pencarian Google Maps. Sertakan lokasi Blitar. Langsung tulis deskripsinya saja tanpa judul atau penjelasan.`,
            categories: `Berdasarkan data toko ini:\n${storeInfo}\nSarankan 3-5 kategori Google Business Profile yang paling relevan. Format: satu kategori per baris, tanpa numbering, tanpa penjelasan tambahan.`,
            seo: `Buatkan 5 kata kunci SEO untuk Google Business Profile toko ini:\n${storeInfo}\nFormat: satu kata kunci per baris, dalam bahasa Indonesia. Sertakan kata kunci lokal (Blitar). Tanpa penjelasan tambahan.`,
        },
        tokopedia: {
            description: `Buatkan deskripsi toko untuk Tokopedia Seller Center berdasarkan data ini:\n${storeInfo}\nBuat dalam bahasa Indonesia, menarik untuk pembeli online, maksimal 500 karakter. Langsung tulis deskripsinya saja.`,
            categories: `Berdasarkan data toko ini:\n${storeInfo}\nSarankan 3 kategori produk Tokopedia yang paling relevan. Format: satu kategori per baris, tanpa penjelasan.`,
        },
        shopee: {
            description: `Buatkan deskripsi toko untuk Shopee Seller Centre berdasarkan data ini:\n${storeInfo}\nBuat dalam bahasa Indonesia, friendly dan menarik, maksimal 500 karakter. Langsung tulis deskripsinya saja.`,
            categories: `Berdasarkan data toko ini:\n${storeInfo}\nSarankan 3 kategori produk Shopee yang paling relevan. Format: satu kategori per baris.`,
        },
        lazada: {
            description: `Buatkan deskripsi toko untuk Lazada Seller Center berdasarkan data ini:\n${storeInfo}\nBuat dalam bahasa Indonesia, profesional, maksimal 500 karakter. Langsung tulis deskripsinya saja.`,
        },
        instagram: {
            bio: `Buatkan bio Instagram Business yang menarik berdasarkan data toko ini:\n${storeInfo}\nMaksimal 150 karakter. Sertakan emoji yang relevan dan call-to-action. Langsung tulis bionya saja.`,
            hashtags: `Buatkan 15 hashtag Instagram yang relevan untuk toko ini:\n${storeInfo}\nCampuran hashtag populer dan lokal (Blitar). Format: satu baris, dipisahkan spasi, tanpa penjelasan.`,
            description: `Buatkan template caption Instagram pertama untuk toko ini:\n${storeInfo}\nBuat caption perkenalan toko, friendly, dengan emoji, dan hashtag di akhir. Maksimal 300 karakter. Langsung tulis captionnya saja.`,
        },
    }

    const prompt = prompts[platform]?.[type]
    if (!prompt) {
        return NextResponse.json({ error: 'Invalid type/platform' }, { status: 400 })
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        })

        const text = response.text || ''
        return NextResponse.json({ content: text })
    } catch (err) {
        console.error('Gemini API error:', err)
        return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
    }
}
