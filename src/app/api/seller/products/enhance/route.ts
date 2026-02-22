import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Upload file to a Gradio Space, then call predict
async function callGradioSpace(
    spaceUrl: string,
    imageBuffer: Buffer,
    hfToken?: string,
): Promise<string> {
    const headers: Record<string, string> = {}
    if (hfToken) headers['Authorization'] = `Bearer ${hfToken}`

    // Step 1: Upload the image file to the Space
    const formData = new FormData()
    const blob = new Blob([new Uint8Array(imageBuffer)], { type: 'image/jpeg' })
    formData.append('files', blob, 'image.jpg')

    console.log(`[gradio] Uploading to ${spaceUrl}/upload ...`)
    const uploadRes = await fetch(`${spaceUrl}/upload`, {
        method: 'POST',
        headers,
        body: formData,
    })

    if (!uploadRes.ok) {
        const errText = await uploadRes.text()
        console.error('[gradio] Upload failed:', uploadRes.status, errText.slice(0, 300))
        throw new Error(`Upload failed: ${uploadRes.status}`)
    }

    const uploadPaths = await uploadRes.json()
    // Returns array of file paths like ["/tmp/gradio/xxx/image.jpg"]
    const filePath = Array.isArray(uploadPaths) ? uploadPaths[0] : uploadPaths
    console.log('[gradio] Uploaded file path:', filePath)

    // Step 2: Queue the prediction
    console.log(`[gradio] Calling predict...`)
    const queueRes = await fetch(`${spaceUrl}/call/predict`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            data: [{ path: filePath, meta: { _type: 'gradio.FileData' } }],
        }),
    })

    if (!queueRes.ok) {
        const errText = await queueRes.text()
        console.error('[gradio] Queue failed:', queueRes.status, errText.slice(0, 500))
        throw new Error(`Predict failed: ${queueRes.status} - ${errText.slice(0, 200)}`)
    }

    const { event_id } = await queueRes.json()
    if (!event_id) throw new Error('No event_id returned')
    console.log('[gradio] Event ID:', event_id)

    // Step 3: Poll for result (SSE stream)
    const resultRes = await fetch(`${spaceUrl}/call/predict/${event_id}`, { headers })
    if (!resultRes.ok) {
        throw new Error(`Result polling failed: ${resultRes.status}`)
    }

    const sseText = await resultRes.text()
    console.log('[gradio] SSE response length:', sseText.length)

    // Parse SSE: look for "data: [...]\n" line after "event: complete"
    const lines = sseText.split('\n')
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('data: ')) {
            const dataStr = lines[i].slice(6)
            try {
                const parsed = JSON.parse(dataStr)
                // Result format: [{ path: "...", url: "...", ... }]
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const item = parsed[0]
                    // Gradio returns a file object with url
                    if (item && item.url) {
                        // Download the result image
                        const imgRes = await fetch(item.url, { headers })
                        if (imgRes.ok) {
                            const buf = await imgRes.arrayBuffer()
                            return `data:image/png;base64,${Buffer.from(buf).toString('base64')}`
                        }
                    }
                    if (item && item.path) {
                        // Try fetching from the space's file endpoint
                        const fileUrl = `${spaceUrl}/file=${item.path}`
                        const imgRes = await fetch(fileUrl, { headers })
                        if (imgRes.ok) {
                            const buf = await imgRes.arrayBuffer()
                            return `data:image/png;base64,${Buffer.from(buf).toString('base64')}`
                        }
                    }
                }
            } catch {
                // skip non-JSON lines
            }
        }
    }

    throw new Error('No image found in Space response')
}

export async function POST(request: Request) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const hfToken = process.env.HF_API_TOKEN || undefined

    let body
    try { body = await request.json() } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { image_base64, action } = body
    if (!image_base64) {
        return NextResponse.json({ error: 'image_base64 is required' }, { status: 400 })
    }

    const imageBuffer = Buffer.from(image_base64, 'base64')
    console.log(`[enhance] action=${action}, size=${(imageBuffer.length / 1024).toFixed(0)}KB`)

    try {
        let spaceUrl = ''

        if (action === 'remove_bg' || action === 'enhance') {
            spaceUrl = 'https://briaai-bria-rmbg-2-0.hf.space'
        } else if (action === 'upscale') {
            spaceUrl = 'https://bookbot-image-upscaling-playground.hf.space'
        } else {
            return NextResponse.json({ error: `Action "${action}" tidak dikenali` }, { status: 400 })
        }

        const result = await callGradioSpace(spaceUrl, imageBuffer, hfToken)
        return NextResponse.json({ result })
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[enhance] Error:', msg)
        return NextResponse.json({ error: `Gagal enhance: ${msg}` }, { status: 500 })
    }
}
