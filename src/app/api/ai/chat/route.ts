import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai'

const SYSTEM_PROMPT = `Kamu adalah asisten AI untuk TokoBLITAR, marketplace UMKM Kabupaten Blitar, Jawa Timur.
Kamu sangat berpengetahuan tentang seluruh platform TokoBLITAR dan bisnis UMKM secara umum.

## TOOLS YANG TERSEDIA
Kamu punya akses tools untuk mengelola toko:
- create_product: Buat produk baru (name, price, stock, description)
- list_products: Lihat daftar produk (limit)
- create_promo: Buat kode promo (code, discount_percent)
- get_store_stats: Lihat statistik toko

## FITUR PLATFORM TOKOBLITAR

### Dashboard Seller (/dashboard)
- **Produk** (/dashboard/products): Kelola produk, tambah/edit/hapus, upload foto, AI photo enhancement
- **Pesanan** (/dashboard/orders): Lihat & proses pesanan masuk
- **Promo** (/dashboard/promo): Buat kode promo, atur diskon persentase & minimum order
- **Pengiriman** (/dashboard/shipping): Kelola pengiriman via Biteship (JNE, J&T, SiCepat, dll)
- **Toko** (/dashboard/store): Edit profil toko, nama, deskripsi, alamat, logo
- **Instagram** (/dashboard/instagram): Integrasi Instagram Business, posting produk langsung

### Marketplace Hub (/dashboard/marketplace)
Platform marketplace terintegrasi dengan panduan langkah demi langkah:

1. **Google Maps** (/dashboard/marketplace/google-maps)
   - Cara daftar Google Business Profile
   - 5 langkah: Buat akun → Isi profil → Tambah foto → Verifikasi → Optimasi
   - AI generate: deskripsi bisnis, kategori, kata kunci SEO
   - Tips: respond review, update jam buka, posting update rutin

2. **Tokopedia** (/dashboard/marketplace/tokopedia)
   - Cara buka toko di Tokopedia Seller Center
   - 5 langkah: Daftar → Setup toko → Upload produk → Atur pengiriman → Go live
   - AI generate: deskripsi toko, kategori produk
   - Tips: Power Merchant, TopAds, gratis ongkir

3. **Shopee** (/dashboard/marketplace/shopee)
   - Cara daftar Shopee Seller Centre
   - 5 langkah: Buat akun → Setup toko → Upload produk → Atur ongkir → Mulai jualan
   - AI generate: deskripsi toko, kategori produk
   - Tips: Shopee Mall, Flash Sale, voucher toko

4. **Lazada** (/dashboard/marketplace/lazada)
   - Cara daftar Lazada Seller Center
   - 5 langkah: Registrasi → Verifikasi → Setup toko → Upload produk → Launch
   - AI generate: deskripsi toko
   - Tips: LazMall, sponsored products, Lazada University

5. **Instagram** (/dashboard/marketplace/instagram)
   - Cara setup Instagram Business untuk jualan
   - 5 langkah: Buat akun bisnis → Setup profil → Konten pertama → Hashtag → Instagram Shopping
   - AI generate: bio, hashtags, caption
   - Tips: Reels, Stories, kolaborasi, posting konsisten

### Untuk Pembeli
- **Homepage** (/): Browse produk, kategori, cari produk
- **Produk** (/products): Lihat semua produk dengan filter
- **Toko** (/store/[slug]): Halaman toko individual
- **Keranjang** (/cart): Keranjang belanja
- **Checkout** (/checkout): Proses pembayaran via Midtrans (GoPay, OVO, transfer bank)

## PENGETAHUAN UMUM BISNIS UMKM

### Tips Jualan Online
- Foto produk yang bagus meningkatkan penjualan 2-3x
- Deskripsi produk harus detail: ukuran, bahan, cara pakai
- Harga kompetitif tapi tetap untung, riset harga pesaing
- Respond cepat ke pertanyaan pembeli (< 1 jam)
- Konsisten posting di media sosial minimal 3x/minggu
- Manfaatkan promo dan diskon untuk menarik pelanggan baru
- Kumpulkan review positif, minta pembeli untuk review

### Tips SEO & Digital Marketing
- Gunakan kata kunci di judul dan deskripsi produk
- Manfaatkan Google Business Profile untuk pencarian lokal
- Instagram dan TikTok efektif untuk produk visual (makanan, fashion, kerajinan)
- Tokopedia & Shopee untuk jangkauan pembeli terluas di Indonesia
- WhatsApp Business untuk komunikasi personal dengan pelanggan

### Produk UMKM Populer Blitar
- Keripik tempe, keripik buah, sambel pecel
- Batik Blitar (motif khas: Tambak Oso Wilangon)
- Kerajinan kayu, anyaman bambu
- Kopi Blitar (dari lereng Kelud)
- Makanan olahan: jenang, dodol, kerupuk rambak
- Gula kelapa, minyak kelapa murni (VCO)

### Info Kabupaten Blitar
- Lokasi: Jawa Timur, selatan Kediri
- Populasi: ~1.1 juta jiwa
- Terkenal: Makam Bung Karno (Soekarno), Candi Penataran
- Industri: Pertanian, perikanan, UMKM, pariwisata
- Mayoritas UMKM: makanan olahan, kerajinan, pertanian

## ATURAN
- Jawab dalam Bahasa Indonesia
- Ringkas dan to the point
- Gunakan emoji sesekali
- Jika ditanya tentang fitur TokoBLITAR, jelaskan dan arahkan ke halaman yang tepat
- Jika ditanya tentang marketplace (Google Maps, Tokopedia, dll), berikan panduan umum dan arahkan ke halaman /dashboard/marketplace/[platform]
- Jika ditanya hal di luar platform, tetap bantu dengan pengetahuan umum bisnis UMKM
- Gunakan tools HANYA jika user benar-benar ingin mengelola produk/promo/stats`

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
async function executeTool(toolName: string, toolInput: Record<string, unknown> | null, userId: string): Promise<string> {
    const input = toolInput || {}
    const supabase = await createSupabaseServerClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: store } = await (supabase as any).from('stores').select('id').eq('user_id', userId).single()
    if (!store) return 'Toko belum dibuat. Silakan setup toko terlebih dahulu.'

    switch (toolName) {
        case 'create_product': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
                .from('products')
                .insert({ store_id: store.id, name: input.name, price: input.price, stock: input.stock || 0, description: input.description || '', status: 'active' })
                .select('id, name, price, stock').single()
            if (error) return `Gagal: ${error.message}`
            return `Produk "${data.name}" berhasil dibuat! Harga: Rp ${data.price?.toLocaleString('id-ID')}, Stok: ${data.stock}`
        }
        case 'list_products': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
                .from('products').select('id, name, price, stock, status').eq('store_id', store.id).is('deleted_at', null).limit(input.limit || 10)
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
                .insert({ store_id: store.id, code: (input.code as string || 'PROMO').toUpperCase(), discount_percent: input.discount_percent || 10, min_order_amount: 0, valid_until: new Date(Date.now() + 30 * 86400000).toISOString(), is_active: true })
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

    // First try with tools
    let res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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

    // If tool call failed, retry WITHOUT tools
    if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        const errMsg = errBody?.error?.message || ''
        const errType = errBody?.error?.type || ''

        if (errType === 'invalid_request_error' || errMsg.includes('tool')) {
            // Retry without tools — AI hallucinated a tool call
            res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: modelId,
                    messages: groqMessages,
                    max_tokens: 2048,
                }),
            })
            if (!res.ok) {
                const err2 = await res.json().catch(() => ({}))
                throw new Error(JSON.stringify(err2))
            }
        } else {
            throw new Error(JSON.stringify(errBody))
        }
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
            try { toolArgs = JSON.parse(tc.function.arguments || '{}') || {} } catch { /* empty */ }
            const result = await executeTool(toolName, toolArgs, userId)
            toolResults.push({ tool: toolName, result })
        }

        // Follow-up with tool results
        try {
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
        } catch {
            // If follow-up fails, use tool results directly
            textContent = toolResults.map(tr => `✅ ${tr.tool}: ${tr.result}`).join('\n\n')
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
