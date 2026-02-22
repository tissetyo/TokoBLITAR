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

        // Clean base64 string
        const base64Data = image_base64.includes(',') ? image_base64.split(',')[1] : image_base64
        const imageBuffer = Buffer.from(base64Data, 'base64')

        // Using BRIA RMBG-2.0 Space on HuggingFace (Free & excellent for products)
        // We use the direct API approach with gradio_client pattern
        const spaceUrl = 'https://briaai-bria-rmbg-2-0.hf.space'

        console.log(`[enhance] Uploading to Space...`)
        const formData = new FormData()
        const blob = new Blob([new Uint8Array(imageBuffer)], { type: 'image/jpeg' })
        formData.append('files', blob, 'image.jpg')

        const uploadRes = await fetch(`${spaceUrl}/upload`, {
            method: 'POST',
            body: formData,
        })

        if (!uploadRes.ok) {
            console.error('[enhance] Space upload failed:', uploadRes.status)
            throw new Error('Gagal upload ke server AI')
        }

        // Usually returns ["/tmp/gradio/xxx/image.jpg"]
        const uploadPaths = await uploadRes.json()
        const filePath = Array.isArray(uploadPaths) ? uploadPaths[0] : uploadPaths
        console.log(`[enhance] Uploaded path: ${filePath}`)

        console.log(`[enhance] Calling predict...`)
        const predictRes = await fetch(`${spaceUrl}/api/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: [{ path: filePath, meta: { _type: 'gradio.FileData' } }],
                fn_index: 0
            }),
        })

        if (!predictRes.ok) {
            console.error('[enhance] Space predict failed:', predictRes.status)
            throw new Error('Gagal memproses gambar di AI (server sibuk)')
        }

        const predictData = await predictRes.json()

        // Predict data structure is usually: { data: [ { path: "...", url: "..." } ], is_generating: false }
        console.log(`[enhance] Predict success!`)

        let resultUrl = ''
        if (predictData?.data?.[0]?.url) {
            resultUrl = predictData.data[0].url
        } else if (predictData?.data?.[0]?.path) {
            resultUrl = `${spaceUrl}/file=${predictData.data[0].path}`
        }

        if (!resultUrl) {
            throw new Error('URL hasil gambar tidak ditemukan')
        }

        // Fetch the transparent background transparent image
        const imgRes = await fetch(resultUrl)
        if (!imgRes.ok) throw new Error('Gagal mendownload hasil gambar')

        const outBuffer = await imgRes.arrayBuffer()
        const outBase64 = Buffer.from(outBuffer).toString('base64')

        return NextResponse.json({ result: `data:image/png;base64,${outBase64}` })

    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[enhance] Error:', msg)
        return NextResponse.json({ error: `Gagal enhance: ${msg}` }, { status: 500 })
    }
}
