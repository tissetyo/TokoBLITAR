# 01_INSTRUCTIONS.md
> READ THIS FIRST. Read completely before touching any file.

---

## WHAT YOU ARE BUILDING

**TokoBLITAR** — a marketplace platform for UMKM (small businesses) in Kabupaten Blitar, Indonesia.

Stack: Next.js 14 App Router · TypeScript · Supabase · Cloudflare R2 · Tailwind CSS · shadcn/ui · Anthropic Claude API

---

## WHO USES IT

### SELLER (primary — build this user first)
- Creates and manages a branded store
- Lists products with AI-enhanced photos (Replicate SDXL)
- Syncs products to Tokopedia / Shopee / Lazada via official APIs
- Posts to Instagram via Graph API
- Gets a public store page at `{slug}.tokoblitar.com`
- Creates promo codes with scheduled date ranges
- Manages shipping via KirimAja or manual tracking input
- Has an AI sidebar that executes ALL of the above via natural language chat

### BUYER
- Browses homepage, searches products, filters by category
- Adds to cart, applies promo code, pays with QRIS (Midtrans)
- Tracks orders in realtime (Supabase Realtime)
- Profile page with membership card (Bronze / Silver / Gold)

### SUPER ADMIN
- Features / unfeatures stores and products on homepage
- Creates platform-wide promo campaigns
- Edits homepage banners (image + CTA link)
- Enables / disables seller features per store (feature flags)
- Soft-deletes stores or products

---

## THE AI SIDEBAR — CRITICAL FEATURE

Every seller and admin dashboard has a persistent AI sidebar:
- Width: 30% of dashboard, collapsible with toggle button
- Model: `claude-sonnet-4-6` with function calling
- Streams responses via SSE
- Executes any in-app action by calling mapped internal tools

**Example:**
```
User: "tambah produk keripik tempe 500g harga 15rb stok 50"
AI:   [calls create_product tool] → product created in DB
AI:   "Produk 'Keripik Tempe 500g' berhasil ditambahkan ✅"
```

The AI must be able to trigger every seller action. Not optional.

---

## ZERO COST SERVICES — USE ONLY THESE

| Service | Free Tier | Purpose |
|---------|-----------|---------|
| Vercel | Unlimited hobby | Next.js hosting |
| Supabase | 500MB DB, 2GB BW | DB + Auth + Realtime |
| Cloudflare R2 | 10GB, 10M reads/month | All file storage |
| Anthropic API | Free dev credits | AI sidebar |
| Replicate | Pay-per-use | Photo AI enhancement |
| Midtrans | Free sandbox | QRIS payment |
| KirimAja | Free account | Shipping + tracking |
| Resend | 3,000 emails/month | Transactional email |
| Upstash Redis | 10,000 cmds/day | Rate limiting |
| Cloudflare Workers | 100K req/day | `*.tokoblitar.com` subdomain |

---

## EXECUTION ORDER — DO NOT SKIP

```
Sprint 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8
```

See `07_TASKS.md`. Complete every task in a sprint before advancing.

---

## NON-NEGOTIABLE RULES

1. TypeScript strict mode. No `any` type.
2. DB access via Supabase client only. No raw SQL in components.
3. RLS on every table, no exceptions.
4. Server secrets never in client components.
5. Marketplace tokens: AES-256 encrypted in DB, decrypted server-side only.
6. All inputs validated with Zod before DB write.
7. Soft delete only (`deleted_at`). Never hard `DELETE`.
8. Every API route returns `{ data, error, meta }`.
9. Mobile-first. Every page works at 375px.
10. AI sidebar can trigger every seller action.

---

## LANGUAGE

- UI text → Bahasa Indonesia
- Code/comments → English  
- AI responses → Bahasa Indonesia (unless user writes English first)
