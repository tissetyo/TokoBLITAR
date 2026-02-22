import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai'

const SYSTEM_PROMPT = `Kamu adalah asisten AI untuk TokoBLITAR, marketplace UMKM Kabupaten Blitar.
Kamu membantu penjual mengelola toko mereka: menambah produk, mengatur harga, membuat promo, dan memberikan saran bisnis.

Kamu punya akses ke tools berikut:
- create_product: Buat produk baru
- update_product: Update produk yang sudah ada
- list_products: Lihat daftar produk
- create_promo: Buat kode promo
- get_store_stats: Lihat statistik toko

Jawab dalam Bahasa Indonesia. Ringkas dan to the point. Gunakan emoji sesekali.`

const TOOLS = [
    {
        name: 'create_product',
        description: 'Buat produk baru di toko seller',
        parameters: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: 'Nama produk' },
                price: { type: Type.NUMBER, description: 'Harga dalam Rupiah' },
                stock: { type: Type.NUMBER, description: 'Jumlah stok' },
                description: { type: Type.STRING, description: 'Deskripsi produk' },
            },
            required: ['name', 'price'],
        },
    },
    {
        name: 'list_products',
        description: 'Lihat daftar produk di toko seller',
        parameters: {
            type: Type.OBJECT,
            properties: {
                limit: { type: Type.NUMBER, description: 'Jumlah produk (default 10)' },
            },
        },
    },
    {
        name: 'create_promo',
        description: 'Buat kode promo baru',
        parameters: {
            type: Type.OBJECT,
            properties: {
                code: { type: Type.STRING, description: 'Kode promo (uppercase)' },
                discount_percent: { type: Type.NUMBER, description: 'Persen diskon (1-100)' },
            },
            required: ['code', 'discount_percent'],
        },
    },
    {
        name: 'get_store_stats',
        description: 'Lihat ringkasan statistik toko',
        parameters: {
            type: Type.OBJECT,
            properties: {},
        },
    },
]

// Execute AI tools against the database
async function executeTool(toolName: string, toolInput: Record<string, unknown>, userId: string): Promise<string> {
    const supabase = await createSupabaseServerClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: store } = await (supabase as any)
        .from('stores')
        .select('id')
        .eq('user_id', userId)
        .single()

    if (!store) return 'Toko belum dibuat. Silakan setup toko terlebih dahulu.'

    switch (toolName) {
        case 'create_product': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
                .from('products')
                .insert({
                    store_id: store.id,
                    name: toolInput.name,
                    price: toolInput.price,
                    stock: toolInput.stock || 0,
                    description: toolInput.description || '',
                    status: 'active',
                })
                .select('id, name, price, stock, status')
                .single()

            if (error) return `Gagal: ${error.message}`
            return `Produk "${data.name}" berhasil dibuat! Harga: Rp ${data.price?.toLocaleString('id-ID')}, Stok: ${data.stock}`
        }

        case 'list_products': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
                .from('products')
                .select('id, name, price, stock, status')
                .eq('store_id', store.id)
                .is('deleted_at', null)
                .limit(toolInput.limit || 10)

            if (error) return `Gagal: ${error.message}`
            if (!data?.length) return 'Belum ada produk di toko Anda.'

            return data.map((p: { name: string; price: number; stock: number; status: string }) =>
                `• ${p.name} — Rp ${p.price?.toLocaleString('id-ID')} (stok: ${p.stock}, ${p.status})`
            ).join('\n')
        }

        case 'create_promo': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
                .from('promo_codes')
                .insert({
                    store_id: store.id,
                    code: (toolInput.code as string).toUpperCase(),
                    discount_percent: toolInput.discount_percent,
                    min_order_amount: 0,
                    valid_until: new Date(Date.now() + 30 * 86400000).toISOString(),
                    is_active: true,
                })
                .select('code, discount_percent')
                .single()

            if (error) return `Gagal: ${error.message}`
            return `Promo "${data.code}" berhasil dibuat! Diskon ${data.discount_percent}%`
        }

        case 'get_store_stats': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const [productsRes, ordersRes] = await Promise.all([
                (supabase as any).from('products').select('id', { count: 'exact', head: true }).eq('store_id', store.id).is('deleted_at', null),
                (supabase as any).from('orders').select('id, total_amount', { count: 'exact' }).eq('store_id', store.id),
            ])

            const totalProducts = productsRes.count || 0
            const totalOrders = ordersRes.count || 0
            const revenue = (ordersRes.data as { total_amount: number }[] | null)
                ?.reduce((s: number, o: { total_amount: number }) => s + Number(o.total_amount), 0) || 0

            return `📊 Statistik Toko:\n• Produk: ${totalProducts}\n• Pesanan: ${totalOrders}\n• Pendapatan: Rp ${revenue.toLocaleString('id-ID')}`
        }

        default:
            return `Tool "${toolName}" tidak dikenali.`
    }
}

export async function POST(request: Request) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        return NextResponse.json({ error: 'GEMINI_API_KEY belum di-set' }, { status: 503 })
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Silakan login terlebih dahulu' }, { status: 401 })

    let body
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { messages, model: requestModel } = body
    const ALLOWED_MODELS = [
        'gemini-2.0-flash-lite',
        'gemini-2.0-flash',
        'gemini-2.5-flash-preview-05-20',
        'gemini-2.5-pro-preview-05-06',
    ]
    const model = ALLOWED_MODELS.includes(requestModel) ? requestModel : 'gemini-2.0-flash-lite'

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return NextResponse.json({ error: 'Messages is required' }, { status: 400 })
    }

    try {
        const ai = new GoogleGenAI({ apiKey })

        // Get the latest user message
        const lastMsg = messages[messages.length - 1]
        const userPrompt = lastMsg?.content || 'Halo'

        // Build Gemini history — ensure alternating user/model pattern
        // Gemini requires strict alternating roles
        const history: { role: string; parts: { text: string }[] }[] = []
        for (let i = 0; i < messages.length - 1; i++) {
            const m = messages[i]
            if (!m.content || m.content.trim() === '') continue
            const role = m.role === 'assistant' ? 'model' : 'user'
            // Skip if same role as previous (Gemini requires alternating)
            if (history.length > 0 && history[history.length - 1].role === role) continue
            history.push({ role, parts: [{ text: m.content }] })
        }

        // Simple non-tool request first for reliability
        const response = await ai.models.generateContent({
            model,
            contents: [
                ...history,
                { role: 'user', parts: [{ text: userPrompt }] },
            ],
            config: {
                systemInstruction: SYSTEM_PROMPT,
                tools: [{ functionDeclarations: TOOLS as FunctionDeclaration[] }],
            },
        })

        // Process response parts
        const candidate = response.candidates?.[0]
        const parts = candidate?.content?.parts || []

        let textContent = ''
        const toolResults: { tool: string; result: string }[] = []

        for (const part of parts) {
            if (part.text) {
                textContent += part.text
            }
            if (part.functionCall) {
                const toolName = part.functionCall.name || ''
                const toolArgs = (part.functionCall.args || {}) as Record<string, unknown>
                const result = await executeTool(toolName, toolArgs, user.id)
                toolResults.push({ tool: toolName, result })
            }
        }

        // If there were tool calls, follow up with results
        if (toolResults.length > 0) {
            try {
                const toolResultParts = toolResults.map(tr => ({
                    functionResponse: {
                        name: tr.tool,
                        response: { result: tr.result },
                    },
                }))

                const followUp = await ai.models.generateContent({
                    model,
                    contents: [
                        ...history,
                        { role: 'user', parts: [{ text: userPrompt }] },
                        { role: 'model', parts: parts },
                        { role: 'user', parts: toolResultParts },
                    ],
                    config: {
                        systemInstruction: SYSTEM_PROMPT,
                    },
                })

                textContent = followUp.text || textContent
            } catch {
                // If follow-up fails, just use tool results
                textContent = toolResults.map(tr => `✅ ${tr.tool}: ${tr.result}`).join('\n\n')
            }
        }

        // Fallback if no text
        if (!textContent && toolResults.length === 0) {
            textContent = 'Maaf, saya tidak bisa memproses permintaan kamu saat ini. Coba lagi ya!'
        }

        // Stream response as SSE
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            start(controller) {
                // Send tool results first
                for (const tr of toolResults) {
                    controller.enqueue(encoder.encode(
                        `data: ${JSON.stringify({ type: 'tool_result', tool: tr.tool, result: tr.result })}\n\n`
                    ))
                }

                // Send text content
                if (textContent) {
                    const chunks: string[] = []
                    for (let i = 0; i < textContent.length; i += 50) {
                        chunks.push(textContent.slice(i, i + 50))
                    }
                    for (const chunk of chunks) {
                        controller.enqueue(encoder.encode(
                            `data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`
                        ))
                    }
                }

                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                controller.close()
            },
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            },
        })
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        console.error('Gemini API error:', errorMessage)
        return NextResponse.json(
            { error: `AI error: ${errorMessage}` },
            { status: 500 }
        )
    }
}
