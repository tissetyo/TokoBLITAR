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
        const groqKey = process.env.GROQ_API_KEY
        const geminiKey = process.env.GEMINI_API_KEY

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
            // Try Groq first
            if (groqKey) {
                const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'llama-3.3-70b-versatile',
                        messages: [{ role: 'user', content: prompt }],
                        max_tokens: 1024,
                    }),
                })
                if (res.ok) {
                    const data = await res.json()
                    const text = data.choices?.[0]?.message?.content || ''
                    return NextResponse.json({ result: text })
                }
            }

            // Fallback to Gemini
            if (geminiKey) {
                const { GoogleGenAI } = await import('@google/genai')
                const ai = new GoogleGenAI({ apiKey: geminiKey })
                const response = await ai.models.generateContent({
                    model: 'gemini-2.0-flash-lite',
                    contents: prompt,
                })
                return NextResponse.json({ result: response.text || '' })
            }

            return NextResponse.json({ error: 'Tidak ada AI yang tersedia (set GROQ_API_KEY atau GEMINI_API_KEY)' }, { status: 503 })
        } catch (err) {
            console.error('Text gen error:', err)
            return NextResponse.json({ error: 'Gagal generate konten' }, { status: 500 })
        }
    }

    return NextResponse.json({ error: `Type "${type}" tidak dikenali` }, { status: 400 })
}
