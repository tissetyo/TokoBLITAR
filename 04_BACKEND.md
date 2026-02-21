# 04_BACKEND.md
> Build all API routes exactly as specified here. Do not rename routes or change response shapes.

---

## STACK

```
Next.js 14 App Router — all API routes in /app/api/
TypeScript strict
Supabase (server client for all DB access)
Zod (all input validation)
Upstash Redis (rate limiting on every route)
```

---

## FOLDER STRUCTURE

```
/app
  /api
    /auth
      /register/route.ts
      /logout/route.ts
    /seller
      /store/route.ts                        GET, PUT
      /products/route.ts                     GET, POST
      /products/[id]/route.ts                PUT, DELETE
      /products/[id]/enhance-photo/route.ts  POST
      /marketplace/connect/route.ts          POST
      /marketplace/sync/route.ts             POST
      /marketplace/status/route.ts           GET
      /instagram/post/route.ts               POST
      /promo/route.ts                        GET, POST, PUT, DELETE
      /orders/route.ts                       GET
      /shipping/route.ts                     GET, PUT
    /buyer
      /products/route.ts                     GET (public search)
      /cart/route.ts                         GET, POST, DELETE
      /orders/route.ts                       POST
      /orders/[id]/route.ts                  GET
      /orders/[id]/track/route.ts            GET
    /admin
      /dashboard/route.ts                    GET
      /stores/route.ts                       GET
      /stores/[id]/feature/route.ts          PUT
      /stores/[id]/route.ts                  DELETE
      /products/[id]/feature/route.ts        PUT
      /products/[id]/route.ts                DELETE
      /promo/route.ts                        GET, POST, PUT, DELETE
      /banners/route.ts                      GET, POST, PUT, DELETE
      /feature-flags/[storeId]/route.ts      GET, PUT
    /ai
      /chat/route.ts                         POST (SSE stream)
    /webhooks
      /midtrans/route.ts                     POST
      /kiriminaja/route.ts                   POST
```

---

## SUPABASE HELPERS — CREATE THESE FIRST

```ts
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createSupabaseServerClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )
}

export async function getServerUser() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  return profile
}

// lib/supabase/admin.ts — use ONLY in server routes, never in client
import { createClient } from '@supabase/supabase-js'
export const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

---

## RATE LIMITING — APPLY TO ALL ROUTES

```ts
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1m'),
})

export async function checkRateLimit(ip: string) {
  const { success } = await ratelimit.limit(ip)
  return success
}

// Usage in every route:
const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1'
if (!(await checkRateLimit(ip))) {
  return Response.json({ data: null, error: 'Too many requests', meta: {} }, { status: 429 })
}
```

---

## API ROUTES — EXACT SPECS

### POST /api/auth/register
```ts
// Input
{ email: string, password: string, full_name: string, role: 'buyer' | 'seller' }
// Action: supabase.auth.signUp → creates auth.users → trigger creates public.users row
// Output: { data: { user_id }, error, meta }
```

### GET /api/seller/store
```ts
// Auth: seller
// Action: fetch store where user_id = auth.uid()
// Output: { data: Store, error, meta }
```

### PUT /api/seller/store
```ts
// Auth: seller
// Input: Partial<{ name, description, logo_url, banner_url, address, lat, lng, google_maps_url, instagram_handle }>
// Action: update stores where user_id = auth.uid()
// Output: { data: Store, error, meta }
```

### GET /api/seller/products
```ts
// Auth: seller
// Query: ?page=1&limit=20&status=active&search=
// Action: fetch products where store.user_id = auth.uid(), paginated
// Output: { data: Product[], error, meta: { page, limit, total } }
```

### POST /api/seller/products
```ts
// Auth: seller
// Input: { name, description, price, stock, weight_gram, category_id, status }
// Action: insert product → insert product_images if provided
// Output: { data: Product, error, meta }
```

### PUT /api/seller/products/[id]
```ts
// Auth: seller (must own the product)
// Input: Partial<Product fields>
// Output: { data: Product, error, meta }
```

### DELETE /api/seller/products/[id]
```ts
// Auth: seller (must own the product)
// Action: set deleted_at = now() (soft delete)
// Output: { data: { id }, error, meta }
```

### POST /api/seller/products/[id]/enhance-photo
```ts
// Auth: seller
// Input: { image_url: string } — R2 URL of original image
// Action: call Replicate SDXL API to enhance → upload result to R2 → return new URL
// Note: this may take 10-30s, consider returning job_id and polling
// Output: { data: { enhanced_url: string }, error, meta }
```

### POST /api/seller/marketplace/connect
```ts
// Auth: seller
// Input: { platform: 'tokopedia'|'shopee'|'lazada', code: string } — OAuth callback code
// Action: exchange code for access_token → AES-256 encrypt → store in marketplace_connections
// Output: { data: { status: 'connected' }, error, meta }
```

### POST /api/seller/marketplace/sync
```ts
// Auth: seller
// Input: { platform: 'tokopedia'|'shopee'|'lazada', product_ids: string[] }
// Action: decrypt token → map products → call platform API → update marketplace_products
// Output: { data: { synced: number, failed: number }, error, meta }
```

### POST /api/buyer/orders
```ts
// Auth: buyer
// Input: { store_id, items: [{product_id, quantity}], promo_code?, shipping_address, courier }
// Action: validate stock → create order + order_items → init Midtrans transaction → return QR
// Output: { data: { order_id, payment_url, qr_code }, error, meta }
```

### POST /api/webhooks/midtrans
```ts
// No auth (signature verify instead)
// Action: verify SHA512 signature → update order status → if paid: decrement stock, create shipment
// MUST verify: sha512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY) === notification.signature_key
```

### POST /api/webhooks/kiriminaja
```ts
// No auth (verify KirimAja signature)
// Action: update shipments.status → emit Supabase Realtime event
```

### POST /api/ai/chat
```ts
// Auth: seller or admin
// Input: { message: string, session_id?: string }
// Action: load user context → call Claude API with tools → stream SSE → execute tools if called
// Output: SSE stream of text chunks
// On tool execution: execute action, append result, continue streaming
```

---

## AI CHAT ROUTE — DETAILED IMPLEMENTATION

```ts
// app/api/ai/chat/route.ts
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const TOOLS = [
  {
    name: 'create_product',
    description: 'Create a new product in the seller store',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        price: { type: 'number' },
        stock: { type: 'number' },
        description: { type: 'string' },
        category_id: { type: 'string' }
      },
      required: ['name', 'price', 'stock']
    }
  },
  {
    name: 'update_store_info',
    description: 'Update store details like name, description, address',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        address: { type: 'string' }
      }
    }
  },
  {
    name: 'set_store_location',
    description: 'Set store GPS location for Google Maps',
    input_schema: {
      type: 'object',
      properties: {
        lat: { type: 'number' },
        lng: { type: 'number' },
        address: { type: 'string' }
      },
      required: ['lat', 'lng']
    }
  },
  {
    name: 'sync_to_marketplace',
    description: 'Sync products to Tokopedia, Shopee, or Lazada',
    input_schema: {
      type: 'object',
      properties: {
        platform: { type: 'string', enum: ['tokopedia', 'shopee', 'lazada'] },
        product_ids: { type: 'array', items: { type: 'string' } }
      },
      required: ['platform']
    }
  },
  {
    name: 'create_promo',
    description: 'Create a promo code campaign',
    input_schema: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        type: { type: 'string', enum: ['percentage', 'fixed'] },
        value: { type: 'number' },
        starts_at: { type: 'string' },
        ends_at: { type: 'string' }
      },
      required: ['code', 'type', 'value', 'starts_at', 'ends_at']
    }
  },
  {
    name: 'draft_instagram_post',
    description: 'Create an Instagram post draft with caption',
    input_schema: {
      type: 'object',
      properties: {
        product_id: { type: 'string' },
        caption: { type: 'string' },
        schedule_at: { type: 'string' }
      }
    }
  },
  {
    name: 'get_order_summary',
    description: 'Get recent orders and revenue summary for the seller',
    input_schema: { type: 'object', properties: { days: { type: 'number', default: 7 } } }
  },
  {
    name: 'enhance_product_photo',
    description: 'Enhance a product photo using AI (Replicate)',
    input_schema: {
      type: 'object',
      properties: { product_id: { type: 'string' }, image_url: { type: 'string' } },
      required: ['product_id', 'image_url']
    }
  },
  // Admin-only tools
  {
    name: 'feature_store',
    description: 'Feature or unfeature a store on the homepage',
    input_schema: {
      type: 'object',
      properties: { store_id: { type: 'string' }, featured: { type: 'boolean' } },
      required: ['store_id', 'featured']
    }
  },
  {
    name: 'feature_product',
    description: 'Feature or unfeature a product on the homepage',
    input_schema: {
      type: 'object',
      properties: { product_id: { type: 'string' }, featured: { type: 'boolean' } },
      required: ['product_id', 'featured']
    }
  }
]

export async function POST(req: Request) {
  const user = await getServerUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, session_id } = await req.json()

  // Load context
  const store = await getSellerStore(user.id)

  const systemPrompt = `
You are TokoBLITAR AI, embedded in the seller dashboard.
Help sellers manage their store, products, orders, shipping, and promotions.
Current seller: ${user.full_name}
Store: ${store?.name ?? 'not set up yet'} (slug: ${store?.slug ?? 'none'})
Always respond in Bahasa Indonesia unless the user writes in English.
When executing actions, confirm what you did clearly with an emoji checkmark.
`

  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  // Run in background, stream to client
  ;(async () => {
    const messages = [{ role: 'user' as const, content: message }]

    while (true) {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        tools: TOOLS as any,
        messages,
      })

      // Stream text blocks
      for (const block of response.content) {
        if (block.type === 'text') {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ text: block.text })}\n\n`))
        }
      }

      if (response.stop_reason === 'end_turn') break

      if (response.stop_reason === 'tool_use') {
        // Execute tools
        const toolResults = []
        for (const block of response.content) {
          if (block.type === 'tool_use') {
            const result = await executeTool(block.name, block.input, user)
            toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) })
          }
        }
        messages.push({ role: 'assistant', content: response.content })
        messages.push({ role: 'user', content: toolResults as any })
        continue
      }
      break
    }

    await writer.write(encoder.encode('data: [DONE]\n\n'))
    await writer.close()
  })()

  return new Response(stream.readable, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
  })
}

async function executeTool(name: string, input: any, user: any) {
  // Map tool name → internal API call
  switch (name) {
    case 'create_product':
      return fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/seller/products`, {
        method: 'POST', headers: { /* forward auth */ },
        body: JSON.stringify(input)
      }).then(r => r.json())
    // ... other tools call their respective API routes
    default:
      return { error: 'Unknown tool' }
  }
}
```

---

## MARKETPLACE SYNC PATTERN

```ts
// Encrypt before storing
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGO = 'aes-256-gcm'
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex') // 32 bytes

export function encrypt(text: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, KEY, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decrypt(data: string): string {
  const buf = Buffer.from(data, 'base64')
  const iv = buf.slice(0, 12)
  const tag = buf.slice(12, 28)
  const encrypted = buf.slice(28)
  const decipher = createDecipheriv(ALGO, KEY, iv)
  decipher.setAuthTag(tag)
  return decipher.update(encrypted) + decipher.final('utf8')
}
```

---

## SUBDOMAIN ROUTING — CLOUDFLARE WORKER

```js
// Deploy this as a Cloudflare Worker
// DNS: CNAME *.tokoblitar.com → your-vercel-app.vercel.app

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const parts = url.hostname.split('.')
    // wafero.tokoblitar.com → slug = 'wafero'
    if (parts.length === 3 && parts[1] === 'tokoblitar') {
      const slug = parts[0]
      const targetUrl = `https://tokoblitar.com/store/${slug}${url.pathname}${url.search}`
      return fetch(targetUrl, { headers: request.headers })
    }
    return fetch(request)
  }
}
```

---

## ENV VARS REQUIRED

```bash
# Public
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_APP_URL=https://tokoblitar.com

# Server only
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
MIDTRANS_SERVER_KEY=
KIRIMINAJA_API_KEY=
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_KEY=
CLOUDFLARE_R2_BUCKET=tokoblitar-assets
CLOUDFLARE_R2_PUBLIC_URL=https://assets.tokoblitar.com
REPLICATE_API_TOKEN=
RESEND_API_KEY=
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
ENCRYPTION_KEY=    # generate: openssl rand -hex 32
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```
