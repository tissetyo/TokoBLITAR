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
                status: { type: Type.STRING, description: 'Status: active atau draft' },
            },
            required: ['name', 'price'],
        },
    },
    {
        name: 'update_product',
        description: 'Update data produk yang sudah ada',
        parameters: {
            type: Type.OBJECT,
            properties: {
                product_id: { type: Type.STRING, description: 'ID produk' },
                name: { type: Type.STRING, description: 'Nama baru' },
                price: { type: Type.NUMBER, description: 'Harga baru' },
                stock: { type: Type.NUMBER, description: 'Stok baru' },
                status: { type: Type.STRING, description: 'Status: active, draft, atau archived' },
            },
            required: ['product_id'],
        },
    },
    {
        name: 'list_products',
        description: 'Lihat daftar produk di toko seller',
        parameters: {
            type: Type.OBJECT,
            properties: {
                status: { type: Type.STRING, description: 'Filter status: active, draft, atau archived' },
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
                min_order: { type: Type.NUMBER, description: 'Minimum order dalam Rupiah' },
                valid_until: { type: Type.STRING, description: 'Tanggal expired (YYYY-MM-DD)' },
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
                    status: toolInput.status || 'active',
                })
                .select('id, name, price, stock, status')
                .single()

            if (error) return `Gagal: ${error.message}`
            return `Produk "${data.name}" berhasil dibuat! Harga: Rp ${data.price?.toLocaleString('id-ID')}, Stok: ${data.stock}`
        }

        case 'update_product': {
            const { product_id, ...updates } = toolInput
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
                .from('products')
                .update(updates)
                .eq('id', product_id)
                .eq('store_id', store.id)
                .select('name, price, stock, status')
                .single()

            if (error) return `Gagal: ${error.message}`
            return `Produk "${data.name}" berhasil diupdate!`
        }

        case 'list_products': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let query = (supabase as any)
                .from('products')
                .select('id, name, price, stock, status')
                .eq('store_id', store.id)
                .is('deleted_at', null)
                .limit(toolInput.limit || 10)

            if (toolInput.status) query = query.eq('status', toolInput.status)
            const { data, error } = await query

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
                    min_order_amount: toolInput.min_order || 0,
                    valid_until: toolInput.valid_until || new Date(Date.now() + 30 * 86400000).toISOString(),
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
        return NextResponse.json({ error: 'AI service not configured. Set GEMINI_API_KEY.' }, { status: 503 })
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { messages } = await request.json()

    const ai = new GoogleGenAI({ apiKey })

    // Convert messages to Gemini format
    const geminiHistory = (messages || []).slice(0, -1).map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }))

    const lastMessage = messages?.[messages.length - 1]?.content || ''

    try {
        // Call Gemini with function calling
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [
                ...geminiHistory,
                { role: 'user', parts: [{ text: lastMessage }] },
            ],
            config: {
                systemInstruction: SYSTEM_PROMPT,
                tools: [{ functionDeclarations: TOOLS as FunctionDeclaration[] }],
            },
        })

        // Check if there are function calls
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

        // If there were tool calls, make a follow-up request with results
        if (toolResults.length > 0) {
            const toolResultParts = toolResults.map(tr => ({
                functionResponse: {
                    name: tr.tool,
                    response: { result: tr.result },
                },
            }))

            const followUp = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [
                    ...geminiHistory,
                    { role: 'user', parts: [{ text: lastMessage }] },
                    { role: 'model', parts: parts },
                    { role: 'user', parts: toolResultParts },
                ],
                config: {
                    systemInstruction: SYSTEM_PROMPT,
                },
            })

            textContent = followUp.text || textContent
        }

        // Stream response as SSE (simulate streaming for consistent client API)
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            start(controller) {
                // Send tool results first
                for (const tr of toolResults) {
                    controller.enqueue(encoder.encode(
                        `data: ${JSON.stringify({ type: 'tool_result', tool: tr.tool, result: tr.result })}\n\n`
                    ))
                }

                // Send text in chunks to simulate streaming
                const words = textContent.split(' ')
                let chunk = ''
                for (let i = 0; i < words.length; i++) {
                    chunk += (i > 0 ? ' ' : '') + words[i]
                    if (chunk.length > 20 || i === words.length - 1) {
                        controller.enqueue(encoder.encode(
                            `data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`
                        ))
                        chunk = ''
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
        console.error('Gemini API error:', err)
        return NextResponse.json({ error: 'AI service error' }, { status: 500 })
    }
}
