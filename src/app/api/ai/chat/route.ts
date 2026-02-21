import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

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
        input_schema: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'Nama produk' },
                price: { type: 'number', description: 'Harga dalam Rupiah' },
                stock: { type: 'number', description: 'Jumlah stok' },
                description: { type: 'string', description: 'Deskripsi produk' },
                status: { type: 'string', enum: ['active', 'draft'], description: 'Status produk' },
            },
            required: ['name', 'price'],
        },
    },
    {
        name: 'update_product',
        description: 'Update data produk yang sudah ada',
        input_schema: {
            type: 'object',
            properties: {
                product_id: { type: 'string', description: 'ID produk' },
                name: { type: 'string' },
                price: { type: 'number' },
                stock: { type: 'number' },
                status: { type: 'string', enum: ['active', 'draft', 'archived'] },
            },
            required: ['product_id'],
        },
    },
    {
        name: 'list_products',
        description: 'Lihat daftar produk di toko seller',
        input_schema: {
            type: 'object',
            properties: {
                status: { type: 'string', enum: ['active', 'draft', 'archived'] },
                limit: { type: 'number', description: 'Jumlah produk (default 10)' },
            },
        },
    },
    {
        name: 'create_promo',
        description: 'Buat kode promo baru',
        input_schema: {
            type: 'object',
            properties: {
                code: { type: 'string', description: 'Kode promo (uppercase)' },
                discount_percent: { type: 'number', description: 'Persen diskon (1-100)' },
                min_order: { type: 'number', description: 'Minimum order dalam Rupiah' },
                valid_until: { type: 'string', description: 'Tanggal expired (YYYY-MM-DD)' },
            },
            required: ['code', 'discount_percent'],
        },
    },
    {
        name: 'get_store_stats',
        description: 'Lihat ringkasan statistik toko',
        input_schema: {
            type: 'object',
            properties: {},
        },
    },
]

// Execute AI tools against the database
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeTool(toolName: string, toolInput: Record<string, unknown>, userId: string): Promise<string> {
    const supabase = await createSupabaseServerClient()

    // Get seller's store
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
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
        return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { messages } = await request.json()

    // Build Anthropic messages
    const anthropicMessages = (messages || []).map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
    }))

    try {
        // Call Anthropic API
        const anthropicRes = await fetch(ANTHROPIC_API_URL, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 2048,
                system: SYSTEM_PROMPT,
                messages: anthropicMessages,
                tools: TOOLS,
                stream: true,
            }),
        })

        if (!anthropicRes.ok) {
            const err = await anthropicRes.json().catch(() => ({}))
            return NextResponse.json(
                { error: err.error?.message || 'AI API error' },
                { status: anthropicRes.status },
            )
        }

        // Stream response as SSE
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            async start(controller) {
                const reader = anthropicRes.body?.getReader()
                const decoder = new TextDecoder()

                if (!reader) {
                    controller.close()
                    return
                }

                let currentToolName = ''
                let currentToolInput = ''
                let currentToolId = ''
                let buffer = ''

                try {
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break

                        buffer += decoder.decode(value, { stream: true })
                        const lines = buffer.split('\n')
                        buffer = lines.pop() || ''

                        for (const line of lines) {
                            if (!line.startsWith('data: ')) continue
                            const data = line.slice(6).trim()
                            if (!data || data === '[DONE]') continue

                            try {
                                const event = JSON.parse(data)

                                if (event.type === 'content_block_start') {
                                    if (event.content_block?.type === 'tool_use') {
                                        currentToolName = event.content_block.name
                                        currentToolId = event.content_block.id
                                        currentToolInput = ''
                                    }
                                } else if (event.type === 'content_block_delta') {
                                    if (event.delta?.type === 'text_delta') {
                                        controller.enqueue(encoder.encode(
                                            `data: ${JSON.stringify({ type: 'text', content: event.delta.text })}\n\n`
                                        ))
                                    } else if (event.delta?.type === 'input_json_delta') {
                                        currentToolInput += event.delta.partial_json || ''
                                    }
                                } else if (event.type === 'content_block_stop' && currentToolName) {
                                    // Execute tool
                                    let toolArgs: Record<string, unknown> = {}
                                    try { toolArgs = JSON.parse(currentToolInput || '{}') } catch { /* empty */ }

                                    const result = await executeTool(currentToolName, toolArgs, user.id)
                                    controller.enqueue(encoder.encode(
                                        `data: ${JSON.stringify({ type: 'tool_result', tool: currentToolName, result })}\n\n`
                                    ))

                                    currentToolName = ''
                                    currentToolInput = ''
                                    currentToolId = ''
                                }
                            } catch {
                                // Skip unparseable events
                            }
                        }
                    }
                } catch (err) {
                    controller.enqueue(encoder.encode(
                        `data: ${JSON.stringify({ type: 'error', content: 'Stream error' })}\n\n`
                    ))
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
    } catch {
        return NextResponse.json({ error: 'AI service error' }, { status: 500 })
    }
}
