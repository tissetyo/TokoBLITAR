import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { GoogleGenAI } from '@google/genai'

// Flow:
// 1. Send uploaded raw photo to Gemini Vision to get a detailed description prompt
// 2. Send that description to Cloudflare SDXL to generate a professional photo
export async function POST(request: Request) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check API Keys


    let body
    try { body = await request.json() } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { image_base64, action, product_name, product_description } = body
    if (!image_base64) {
        return NextResponse.json({ error: 'image_base64 is required' }, { status: 400 })
    }

    try {
        console.log(`[enhance] Starting enhancement. Action: ${action}`)

        // Only support these actions
        if (!['remove_bg', 'enhance', 'studio_background'].includes(action)) {
            return NextResponse.json({ error: 'Aksi tidak didukung. Gunakan Hapus BG, Full Enhance, atau Studio Background.' }, { status: 400 })
        }

        // Clean base64 string
        const base64Data = image_base64.includes(',') ? image_base64.split(',')[1] : image_base64
        const imageBuffer = Buffer.from(base64Data, 'base64')

        if (action === 'studio_background') {
            const geminiKey = process.env.GEMINI_API_KEY
            if (!geminiKey) return NextResponse.json({ error: 'GEMINI_API_KEY belum dikonfigurasi' }, { status: 503 })

            console.log(`[enhance] Calling Gemini 2.0 Flash for Studio Background...`)
            const ai = new GoogleGenAI({ apiKey: geminiKey })

            // The exact prompt to turn a raw photo into a professional 3D studio shot
            const prompt = `Ini adalah foto produk mentah (raw product photo). 
Tugasmu adalah MENGGANTI LATAR BELAKANG (background) menjadi estetik dan profesional, SEPERTI FOTO STUDIO MAHAL. 
Namun, KAMU HARUS MEMPERTAHANKAN 100% BENTUK ASLI PRODUK INI (jangan ubah bentuk produk utamanya).
Tambahkan pencahayaan studio (lighting), bayangan realistis (shadows), dan letakkan di atas meja kayu estetik atau permukaan premium yang cocok dengan barang tersebut. 
Jadikan resolusi tinggi dan sangat realistis.`

            const chat = ai.chats.create({ model: 'gemini-2.5-flash-image' })

            const response = await chat.sendMessage({
                message: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                    prompt
                ]
            })

            // The output is returned as inlineData base64
            const generatedImageBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data

            if (!generatedImageBase64) {
                throw new Error('Gemini tidak mengembalikan gambar.')
            }

            return NextResponse.json({ result: `data:image/jpeg;base64,${generatedImageBase64}` })
        }

        // --- HUGGINGFACE BACKGROUND REMOVAL ACTION ---
        const hfKey = process.env.HUGGINGFACE_API_KEY
        if (!hfKey) {
            return NextResponse.json({ error: 'HUGGINGFACE_API_KEY belum dikonfigurasi di server' }, { status: 500 })
        }

        // Fetch using Hugging Face Inference API directly
        console.log(`[enhance] Calling Hugging Face Inference API (briaai/RMBG-1.4)...`)
        const hfRes = await fetch(
            "https://api-inference.huggingface.co/models/briaai/RMBG-1.4",
            {
                headers: {
                    Authorization: `Bearer ${hfKey}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: imageBuffer,
            }
        );

        if (!hfRes.ok) {
            const errText = await hfRes.text().catch(() => '')
            console.error('[enhance] HF API failed:', hfRes.status, errText)

            if (hfRes.status === 503) {
                return NextResponse.json({ error: 'Model AI sedang loading, silakan coba lagi dalam 10 detik.' }, { status: 503 })
            }
            throw new Error('Gagal memproses gambar. Server AI mungkin sedang sibuk.')
        }

        const outBuffer = await hfRes.arrayBuffer()
        const outBase64 = Buffer.from(outBuffer).toString('base64')

        return NextResponse.json({ result: `data:image/png;base64,${outBase64}` })

    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[enhance] Error:', msg)
        return NextResponse.json({ error: `Gagal enhance: ${msg}` }, { status: 500 })
    }
}
