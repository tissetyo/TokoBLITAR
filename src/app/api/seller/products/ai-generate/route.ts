import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// POST: AI generate content for products (image, description, category)
export async function POST(request: Request) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { type, product_name, product_description, category } = await request.json()

    if (!type) {
        return NextResponse.json({ error: 'type is required' }, { status: 400 })
    }

    // --- IMAGE GENERATION (Cloudflare Workers AI) ---
    if (type === 'image') {
        const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
        const aiToken = process.env.CLOUDFLARE_AI_TOKEN
        if (!accountId || !aiToken) {
            return NextResponse.json({ error: 'Cloudflare AI not configured' }, { status: 503 })
        }

        const prompt = `professional product photo of ${product_name || 'product'}, ${product_description || 'high quality item'}, studio lighting, white clean background, sharp focus, high resolution, commercial product photography, centered, premium quality, no text, no watermark`

        try {
            const cfRes = await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`,
                {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${aiToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt,
                        negative_prompt: 'blurry, low quality, dark, noisy, watermark, ugly, distorted, text, logo, banner, collage',
                        num_steps: 20,
                        guidance: 7.5,
                        width: 1024,
                        height: 1024,
                    }),
                },
            )

            if (!cfRes.ok) {
                const err = await cfRes.json().catch(() => ({}))
                console.error('Cloudflare AI error:', err)
                return NextResponse.json({ error: 'Gagal generate foto' }, { status: 500 })
            }

            const imageBuffer = await cfRes.arrayBuffer()
            const base64 = Buffer.from(imageBuffer).toString('base64')
            return NextResponse.json({ result: `data:image/png;base64,${base64}` })
        } catch (err) {
            console.error('Image gen error:', err)
            return NextResponse.json({ error: 'Gagal generate foto' }, { status: 500 })
        }
    }

    // --- TEXT GENERATION (Groq or Gemini) ---
    if (type === 'description' || type === 'category') {
        const openrouterKey = process.env.OPENROUTER_API_KEY
        const baseSystemPrompt = "Kamu adalah asisten e-commerce profesional."

        let prompt = ''
        if (type === 'description') {
            prompt = `Buatkan deskripsi produk yang menarik untuk marketplace dalam Bahasa Indonesia.
Nama produk: ${product_name || 'Produk'}
Kategori: ${category || 'Umum'}

Deskripsi harus:
- 2-3 paragraf
- Menyebutkan keunggulan produk
- Bahasa yang menarik dan persuasif
- Menyebutkan bahan/material jika relevan
- Cocok untuk marketplace (Tokopedia, Shopee)

Tulis deskripsi saja, tanpa judul atau label.`
        } else {
            prompt = `Sarankan 3 kategori yang paling cocok untuk produk ini di marketplace Indonesia.
Nama produk: ${product_name || 'Produk'}
Deskripsi: ${product_description || '-'}

Format jawaban HANYA berupa JSON array string, contoh: ["Makanan", "Camilan", "Oleh-oleh"]
Jangan berikan penjelasan, hanya JSON array.`
        }

        try {
            if (!openrouterKey) {
                return NextResponse.json({ error: 'OPENROUTER_API_KEY belum dikonfigurasi' }, { status: 503 })
            }

            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${openrouterKey}`,
                    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                    'X-Title': 'TokoBLITAR',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'google/gemini-2.0-flash-lite-preview-02-05:free', // Free & fast model on OpenRouter
                    messages: [
                        { role: 'system', content: baseSystemPrompt },
                        { role: 'user', content: prompt }
                    ],
                }),
            })

            if (!res.ok) {
                const errText = await res.text()
                console.error('[ai-generate] OpenRouter error:', res.status, errText)
                throw new Error(`OpenRouter API error: ${res.status}`)
            }

            const data = await res.json()
            const text = data.choices?.[0]?.message?.content || ''
            return NextResponse.json({ result: text })

        } catch (err) {
            console.error('Text gen error:', err)
            return NextResponse.json({ error: 'Gagal generate konten' }, { status: 500 })
        }
    }

    return NextResponse.json({ error: `Type "${type}" tidak dikenali` }, { status: 400 })
}
