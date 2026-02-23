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
    const geminiKey = process.env.GEMINI_API_KEY
    if (!geminiKey) return NextResponse.json({ error: 'GEMINI_API_KEY belum di-set' }, { status: 503 })

    const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID
    const cfToken = process.env.CLOUDFLARE_AI_TOKEN
    if (!cfAccountId || !cfToken) return NextResponse.json({ error: 'Cloudflare AI config belum di-set' }, { status: 503 })

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

        // Only support background removal for now, as generative upscale alters the product too much
        if (action !== 'remove_bg' && action !== 'enhance') {
            return NextResponse.json({ error: 'Fitur upscale sedang dalam perbaikan. Gunakan Hapus BG / Full Enhance.' }, { status: 400 })
        }

        const hfKey = process.env.HUGGINGFACE_API_KEY
        if (!hfKey) {
            return NextResponse.json({ error: 'HUGGINGFACE_API_KEY belum dikonfigurasi di server' }, { status: 500 })
        }

        // Clean base64 string
        const base64Data = image_base64.includes(',') ? image_base64.split(',')[1] : image_base64
        const imageBuffer = Buffer.from(base64Data, 'base64')

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
