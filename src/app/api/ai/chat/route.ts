import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai'

const SYSTEM_PROMPT = `Kamu adalah asisten AI untuk TokoBLITAR, marketplace UMKM Kabupaten Blitar.
Kamu membantu penjual mengelola toko mereka: menambah produk, mengatur harga, membuat promo, dan memberikan saran bisnis.

Kamu punya akses ke tools berikut:
- create_product: Buat produk baru
- list_products: Lihat daftar produk
- create_promo: Buat kode promo
- get_store_stats: Lihat statistik toko

Jawab dalam Bahasa Indonesia. Ringkas dan to the point. Gunakan emoji sesekali.`

// --- Model configuration ---
const MODEL_CONFIG: Record<string, { provider: 'groq' | 'gemini'; modelId: string; label: string }> = {
    'llama-3.3-70b': { provider: 'groq', modelId: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
    'gemma2-9b': { provider: 'groq', modelId: 'gemma2-9b-it', label: 'Gemma 2 9B' },
    'llama-3.1-8b': { provider: 'groq', modelId: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B' },
    'gemini-2.0-flash-lite': { provider: 'gemini', modelId: 'gemini-2.0-flash-lite', label: 'Gemini Flash Lite' },
    'gemini-2.0-flash': { provider: 'gemini', modelId: 'gemini-2.0-flash', label: 'Gemini Flash' },
}
const DEFAULT_MODEL = 'llama-3.3-70b'

// --- Gemini tools (for function calling) ---
const GEMINI_TOOLS = [
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

// --- Groq tools (OpenAI-compatible format) ---
const GROQ_TOOLS = [
    {
        type: 'function' as const,
        function: {
            name: 'create_product',
            description: 'Buat produk baru di toko seller',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Nama produk' },
                    price: { type: 'number', description: 'Harga dalam Rupiah' },
                    stock: { type: 'number', description: 'Jumlah stok' },
                    description: { type: 'string', description: 'Deskripsi produk' },
                },
                required: ['name', 'price'],
            },
        },
    },
    {
        type: 'function' as const,
        function: {
            name: 'list_products',
            description: 'Lihat daftar produk di toko seller',
            parameters: {
                type: 'object',
                properties: {
                    limit: { type: 'number', description: 'Jumlah produk (default 10)' },
                },
            },
        },
    },
    {
        type: 'function' as const,
        function: {
            name: 'create_promo',
            description: 'Buat kode promo baru',
            parameters: {
                type: 'object',
                properties: {
                    code: { type: 'string', description: 'Kode promo (uppercase)' },
                    discount_percent: { type: 'number', description: 'Persen diskon (1-100)' },
                },
                required: ['code', 'discount_percent'],
            },
        },
    },
    {
        type: 'function' as const,
        function: {
            name: 'get_store_stats',
            description: 'Lihat ringkasan statistik toko',
            parameters: {
                type: 'object',
                properties: {},
            },
        },
    },
]

// Execute tools against the database
async function executeTool(toolName: string, toolInput: Record<string, unknown>, userId: string): Promise<string> {
    const supabase = await createSupabaseServerClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: store } = await (supabase as any).from('stores').select('id').eq('user_id', userId).single()
    if (!store) return 'Toko belum dibuat. Silakan setup toko terlebih dahulu.'

    switch (toolName) {
        case 'create_product': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
                .from('products')
                .insert({ store_id: store.id, name: toolInput.name, price: toolInput.price, stock: toolInput.stock || 0, description: toolInput.description || '', status: 'active' })
                .select('id, name, price, stock').single()
            if (error) return `Gagal: ${error.message}`
            return `Produk "${data.name}" berhasil dibuat! Harga: Rp ${data.price?.toLocaleString('id-ID')}, Stok: ${data.stock}`
        }
        case 'list_products': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
                .from('products').select('id, name, price, stock, status').eq('store_id', store.id).is('deleted_at', null).limit(toolInput.limit || 10)
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
                .insert({ store_id: store.id, code: (toolInput.code as string).toUpperCase(), discount_percent: toolInput.discount_percent, min_order_amount: 0, valid_until: new Date(Date.now() + 30 * 86400000).toISOString(), is_active: true })
                .select('code, discount_percent').single()
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

// --- SSE helper ---
function createSSEStream(toolResults: { tool: string; result: string }[], textContent: string) {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
        start(controller) {
            for (const tr of toolResults) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'tool_result', tool: tr.tool, result: tr.result })}\n\n`))
            }
            if (textContent) {
                const chunks: string[] = []
                for (let i = 0; i < textContent.length; i += 50) {
                    chunks.push(textContent.slice(i, i + 50))
                }
                for (const chunk of chunks) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`))
                }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
        },
    })
    return new Response(stream, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    })
}

// --- Groq handler (OpenAI-compatible) ---
async function handleGroq(apiKey: string, modelId: string, messages: { role: string; content: string }[], userId: string) {
    const groqMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    ]

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: modelId,
            messages: groqMessages,
            tools: GROQ_TOOLS,
            tool_choice: 'auto',
            max_tokens: 2048,
        }),
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(JSON.stringify(err))
    }

    const data = await res.json()
    const choice = data.choices?.[0]
    const message = choice?.message

    let textContent = message?.content || ''
    const toolResults: { tool: string; result: string }[] = []

    // Handle tool calls
    if (message?.tool_calls && message.tool_calls.length > 0) {
        for (const tc of message.tool_calls) {
            const toolName = tc.function.name
            let toolArgs: Record<string, unknown> = {}
            try { toolArgs = JSON.parse(tc.function.arguments || '{}') } catch { /* empty */ }
            const result = await executeTool(toolName, toolArgs, userId)
            toolResults.push({ tool: toolName, result })
        }

        // Follow-up with tool results
        const followUpMessages = [
            ...groqMessages,
            message,
            ...toolResults.map((tr, i) => ({
                role: 'tool' as const,
                tool_call_id: message.tool_calls[i].id,
                content: tr.result,
            })),
        ]

        const followUpRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelId, messages: followUpMessages, max_tokens: 2048 }),
        })

        if (followUpRes.ok) {
            const followUpData = await followUpRes.json()
            textContent = followUpData.choices?.[0]?.message?.content || textContent
        }
    }

    if (!textContent && toolResults.length === 0) {
        textContent = 'Maaf, coba lagi ya! 🙏'
    }

    return createSSEStream(toolResults, textContent)
}

// --- Gemini handler ---
async function handleGemini(apiKey: string, modelId: string, messages: { role: string; content: string }[], userId: string) {
    const ai = new GoogleGenAI({ apiKey })

    const lastMsg = messages[messages.length - 1]
    const userPrompt = lastMsg?.content || 'Halo'

    // Build history with strict alternating roles
    const history: { role: string; parts: { text: string }[] }[] = []
    for (let i = 0; i < messages.length - 1; i++) {
        const m = messages[i]
        if (!m.content || m.content.trim() === '') continue
        const role = m.role === 'assistant' ? 'model' : 'user'
        if (history.length > 0 && history[history.length - 1].role === role) continue
        history.push({ role, parts: [{ text: m.content }] })
    }

    const response = await ai.models.generateContent({
        model: modelId,
        contents: [...history, { role: 'user', parts: [{ text: userPrompt }] }],
        config: {
            systemInstruction: SYSTEM_PROMPT,
            tools: [{ functionDeclarations: GEMINI_TOOLS as FunctionDeclaration[] }],
        },
    })

    const parts = response.candidates?.[0]?.content?.parts || []
    let textContent = ''
    const toolResults: { tool: string; result: string }[] = []

    for (const part of parts) {
        if (part.text) textContent += part.text
        if (part.functionCall) {
            const toolName = part.functionCall.name || ''
            const toolArgs = (part.functionCall.args || {}) as Record<string, unknown>
            const result = await executeTool(toolName, toolArgs, userId)
            toolResults.push({ tool: toolName, result })
        }
    }

    if (toolResults.length > 0) {
        try {
            const toolResultParts = toolResults.map(tr => ({
                functionResponse: { name: tr.tool, response: { result: tr.result } },
            }))
            const followUp = await ai.models.generateContent({
                model: modelId,
                contents: [
                    ...history,
                    { role: 'user', parts: [{ text: userPrompt }] },
                    { role: 'model', parts },
                    { role: 'user', parts: toolResultParts },
                ],
                config: { systemInstruction: SYSTEM_PROMPT },
            })
            textContent = followUp.text || textContent
        } catch {
            textContent = toolResults.map(tr => `✅ ${tr.tool}: ${tr.result}`).join('\n\n')
        }
    }

    if (!textContent && toolResults.length === 0) {
        textContent = 'Maaf, coba lagi ya! 🙏'
    }

    return createSSEStream(toolResults, textContent)
}

// --- Main POST handler ---
export async function POST(request: Request) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Silakan login terlebih dahulu' }, { status: 401 })

    let body
    try { body = await request.json() } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { messages, model: requestModel } = body
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return NextResponse.json({ error: 'Messages required' }, { status: 400 })
    }

    // Resolve model
    const modelKey = (requestModel && MODEL_CONFIG[requestModel]) ? requestModel : DEFAULT_MODEL
    const config = MODEL_CONFIG[modelKey]

    try {
        if (config.provider === 'groq') {
            const groqKey = process.env.GROQ_API_KEY
            if (!groqKey) return NextResponse.json({ error: 'GROQ_API_KEY belum di-set' }, { status: 503 })
            return await handleGroq(groqKey, config.modelId, messages, user.id)
        } else {
            const geminiKey = process.env.GEMINI_API_KEY
            if (!geminiKey) return NextResponse.json({ error: 'GEMINI_API_KEY belum di-set' }, { status: 503 })
            return await handleGemini(geminiKey, config.modelId, messages, user.id)
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        console.error(`AI error (${config.provider}/${config.modelId}):`, msg)
        return NextResponse.json({ error: `AI error: ${msg}` }, { status: 500 })
    }
}
