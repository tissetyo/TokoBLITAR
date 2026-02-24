import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Flow:
// 1. Send uploaded raw photo to Gemini Vision to get a detailed description prompt
// 2. Send that description to Cloudflare SDXL to generate a professional photo
export async function POST(request: Request) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body
    try { body = await request.json() } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { image_base64, action, mask_base64, product_name, visionModel = '@cf/llava-hf/llava-1.5-7b-hf', promptText, customInstruction } = body
    if (!image_base64 && action !== 'generate_from_prompt') {
        return NextResponse.json({ error: 'Image is required' }, { status: 400 })
    }

    try {
        console.log(`[enhance] Starting enhancement. Action: ${action}`)

        if (!['enhance', 'studio_background', 'generate_from_prompt', 'inpaint', 'detect_object'].includes(action)) {
            return NextResponse.json({ error: 'Aksi tidak didukung.' }, { status: 400 })
        }

        // Clean base64 string
        const base64Data = image_base64?.includes(',') ? image_base64.split(',')[1] : image_base64
        const imageBuffer = base64Data ? Buffer.from(base64Data, 'base64') : undefined

        if (!['studio_background', 'enhance', 'generate_from_prompt'].includes(action)) {
            return NextResponse.json({ error: 'Aksi tidak valid atau sudah tidak didukung' }, { status: 400 })
        }



    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[enhance] Error:', msg)
        return NextResponse.json({ error: `Gagal enhance: ${msg}` }, { status: 500 })
    }
}
