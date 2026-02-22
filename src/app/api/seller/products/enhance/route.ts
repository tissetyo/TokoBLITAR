import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Call a HuggingFace Space via Gradio API (free, no token needed for public spaces)
async function callGradioSpace(
    spaceUrl: string,
    fnIndex: number,
    data: unknown[],
    hfToken?: string,
): Promise<unknown> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (hfToken) headers['Authorization'] = `Bearer ${hfToken}`

    // Step 1: Queue the prediction
    const queueRes = await fetch(`${spaceUrl}/call/predict`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ data, fn_index: fnIndex }),
    })

    if (!queueRes.ok) {
        const errText = await queueRes.text()
        console.error('[gradio] Queue failed:', queueRes.status, errText.slice(0, 300))
        throw new Error(`Space queue failed: ${queueRes.status}`)
    }

    const { event_id } = await queueRes.json()
    if (!event_id) throw new Error('No event_id from Space')

    // Step 2: Poll for result via SSE
    const resultRes = await fetch(`${spaceUrl}/call/predict/${event_id}`, { headers })
    if (!resultRes.ok) {
        throw new Error(`Space result failed: ${resultRes.status}`)
    }

    const text = await resultRes.text()
    // SSE format: "event: ...\ndata: ...\n\n"
    const lines = text.split('\n')
    for (const line of lines) {
        if (line.startsWith('data: ')) {
            const dataStr = line.slice(6)
            try {
                const parsed = JSON.parse(dataStr)
                return parsed
            } catch {
                // Not JSON, continue
            }
        }
    }

    throw new Error('No valid data in Space response')
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

    // Build data URL from base64
    const dataUrl = image_base64.startsWith('data:')
        ? image_base64
        : `data:image/jpeg;base64,${image_base64}`

    console.log(`[enhance] action=${action}, imageLen=${image_base64.length}`)

    try {
        if (action === 'remove_bg' || action === 'enhance') {
            // Use RMBG-2.0 Space for background removal
            const spaceUrl = 'https://briaai-bria-rmbg-2-0.hf.space'

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result: any = await callGradioSpace(
                spaceUrl,
                0, // fn_index 0 = main predict function
                [{ path: dataUrl, meta: { _type: 'gradio.FileData' } }],
                hfToken,
            )

            // Result is typically [{ path: "...", url: "...", ... }] or [dataUrl]
            if (Array.isArray(result)) {
                const first = result[0]
                if (typeof first === 'string' && first.startsWith('data:')) {
                    return NextResponse.json({ result: first })
                }
                if (first && typeof first === 'object') {
                    // Has a URL to the result file
                    if (first.url) {
                        const imgRes = await fetch(first.url)
                        if (imgRes.ok) {
                            const buf = await imgRes.arrayBuffer()
                            const b64 = Buffer.from(buf).toString('base64')
                            return NextResponse.json({ result: `data:image/png;base64,${b64}` })
                        }
                    }
                    if (first.path && first.path.startsWith('data:')) {
                        return NextResponse.json({ result: first.path })
                    }
                }
            }

            // If result is a direct object with url
            if (result && typeof result === 'object' && !Array.isArray(result)) {
                if (result.url) {
                    const imgRes = await fetch(result.url)
                    if (imgRes.ok) {
                        const buf = await imgRes.arrayBuffer()
                        const b64 = Buffer.from(buf).toString('base64')
                        return NextResponse.json({ result: `data:image/png;base64,${b64}` })
                    }
                }
            }

            console.error('[enhance] Unexpected result:', JSON.stringify(result).slice(0, 500))
            return NextResponse.json({ error: 'Format hasil tidak dikenali' }, { status: 500 })
        }

        if (action === 'upscale') {
            // Use an upscaler Space
            const spaceUrl = 'https://bookbot-image-upscaling-playground.hf.space'

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result: any = await callGradioSpace(
                spaceUrl,
                0,
                [{ path: dataUrl, meta: { _type: 'gradio.FileData' } }, 2], // 2x upscale
                hfToken,
            )

            if (Array.isArray(result)) {
                const first = result[0]
                if (typeof first === 'string' && first.startsWith('data:')) {
                    return NextResponse.json({ result: first })
                }
                if (first?.url) {
                    const imgRes = await fetch(first.url)
                    if (imgRes.ok) {
                        const buf = await imgRes.arrayBuffer()
                        const b64 = Buffer.from(buf).toString('base64')
                        return NextResponse.json({ result: `data:image/png;base64,${b64}` })
                    }
                }
            }

            return NextResponse.json({ error: 'Gagal upscale foto' }, { status: 500 })
        }

        return NextResponse.json({ error: `Action "${action}" tidak dikenali` }, { status: 400 })
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[enhance] Error:', msg)
        return NextResponse.json({ error: `Gagal enhance: ${msg}` }, { status: 500 })
    }
}
