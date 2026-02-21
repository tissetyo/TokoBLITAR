# 07_TASKS.md
> Execute tasks in exact order. Do not start Sprint N+1 until all tasks in Sprint N are done and working.
> Size: S = <4h · M = 4-8h · L = 1-2d · XL = 2d+

---

## SPRINT 0 — Infrastructure
_Goal: Project runs locally with DB connected and all services configured._

| ID | Task | Size | Done |
|----|------|------|------|
| S0-01 | Run `create-next-app` with TypeScript + Tailwind + App Router | S | [ ] |
| S0-02 | Install all deps from `06_FRONTEND.md` INSTALL COMMANDS section | S | [ ] |
| S0-03 | Create `src/` structure exactly as in `06_FRONTEND.md` FOLDER STRUCTURE | S | [ ] |
| S0-04 | Add design tokens to `globals.css` (from `05_UIUX.md`) | S | [ ] |
| S0-05 | Create `.env.local` and `.env.example` with all vars from `04_BACKEND.md` | S | [ ] |
| S0-06 | Create Supabase project → link locally → run all 13 migrations from `03_ERD.md` in order | L | [ ] |
| S0-07 | Generate Supabase TypeScript types → save to `src/types/supabase.ts` | S | [ ] |
| S0-08 | Create `lib/supabase/client.ts`, `lib/supabase/server.ts` (from `06_FRONTEND.md`) | S | [ ] |
| S0-09 | Create `lib/r2.ts` — R2 upload helper (from `06_FRONTEND.md`) | S | [ ] |
| S0-10 | Create `lib/rate-limit.ts` — Upstash Redis limiter (from `04_BACKEND.md`) | S | [ ] |
| S0-11 | Create `lib/encrypt.ts` — AES-256 encrypt/decrypt (from `04_BACKEND.md`) | S | [ ] |
| S0-12 | Create `lib/utils.ts` — cn(), formatPrice(), formatDate(), generateSlug() | S | [ ] |
| S0-13 | Setup Cloudflare R2 bucket, CORS policy, public domain | S | [ ] |
| S0-14 | Deploy to Vercel, confirm it builds with no TS errors | S | [ ] |

**Sprint 0 done when:** `npm run build` passes with 0 errors. App loads at localhost:3000.

---

## SPRINT 1 — Auth + Seller Onboarding
_Goal: A seller can register, verify email, and complete full store setup._

| ID | Task | Size | Done |
|----|------|------|------|
| S1-01 | Create `middleware.ts` — protect `/dashboard/*` (seller), `/admin/*` (admin), redirect to `/login` | M | [ ] |
| S1-02 | Build `/login` page — email + password, Supabase Auth, redirect by role | M | [ ] |
| S1-03 | Build `/register` page — name, email, password, role select (buyer/seller) | M | [ ] |
| S1-04 | `POST /api/auth/register` — creates Supabase auth user + public.users row | S | [ ] |
| S1-05 | Setup Resend email confirmation (Supabase handles, customize template) | S | [ ] |
| S1-06 | Build `DashboardLayout.tsx` — left nav + main content + AI sidebar placeholder | L | [ ] |
| S1-07 | Build `SellerNav.tsx` — all 8 nav links, active state, store logo at top | M | [ ] |
| S1-08 | Build `OnboardingStepper.tsx` — 6 steps (see `05_UIUX.md` Flow 1) | XL | [ ] |
| S1-09 | Step 1: store name + slug (live availability check via Supabase `stores.slug`) | M | [ ] |
| S1-10 | Step 2: logo + banner upload → `ImageUpload.tsx` component → R2 | M | [ ] |
| S1-11 | Step 3: description + category select | S | [ ] |
| S1-12 | Step 4: `MapPicker.tsx` — Google Maps embed, click to set lat/lng, address autocomplete | L | [ ] |
| S1-13 | Step 5: marketplace connect placeholder (skip button) | S | [ ] |
| S1-14 | Step 6: add first product shortcut (skip button) | S | [ ] |
| S1-15 | `GET /api/seller/store` and `PUT /api/seller/store` — full store CRUD | M | [ ] |
| S1-16 | Seller dashboard `/dashboard/page.tsx` — 4 stat cards (all zeros for now) | S | [ ] |

**Sprint 1 done when:** New seller can register → verify email → complete all 6 setup steps → land on dashboard.

---

## SPRINT 2 — Products + AI Photo
_Goal: Seller can create, edit, delete products and enhance photos with AI._

| ID | Task | Size | Done |
|----|------|------|------|
| S2-01 | `GET /api/seller/products` — paginated, filter by status + search | M | [ ] |
| S2-02 | `POST /api/seller/products` — create product + images | M | [ ] |
| S2-03 | `PUT /api/seller/products/[id]` — update | S | [ ] |
| S2-04 | `DELETE /api/seller/products/[id]` — soft delete (set deleted_at) | S | [ ] |
| S2-05 | `/dashboard/products/page.tsx` — `DataTable` with columns: image, name, price, stock, status, actions | L | [ ] |
| S2-06 | `/dashboard/products/new/page.tsx` — `ProductForm.tsx` with all fields | L | [ ] |
| S2-07 | `ProductForm.tsx` — RHF + Zod, fields: name, description (Tiptap), price, stock, weight, category, status | L | [ ] |
| S2-08 | Multi-image upload in `ProductForm`: up to 8 images, drag to reorder, set primary | M | [ ] |
| S2-09 | `POST /api/seller/products/[id]/enhance-photo` — call Replicate SDXL, upload result to R2 | L | [ ] |
| S2-10 | `PhotoEnhancer.tsx` — before/after UI, accept/reject per image (see `05_UIUX.md`) | M | [ ] |
| S2-11 | Seed categories table: Makanan, Minuman, Kerajinan, Fashion, Pertanian, Lainnya | S | [ ] |
| S2-12 | `/dashboard/products/[id]/page.tsx` — edit product page (reuse ProductForm) | S | [ ] |

**Sprint 2 done when:** Seller can create a product, upload 3 photos, enhance them with AI, see before/after, save product.

---

## SPRINT 3 — Full Buyer Flow
_Goal: Buyer can browse, search, cart, checkout with QRIS, and track order._

| ID | Task | Size | Done |
|----|------|------|------|
| S3-01 | `GET /api/buyer/products` — public, search by q, filter by category_id, price_min/max, page/limit | M | [ ] |
| S3-02 | Homepage `/page.tsx` — ISR 60s, hero carousel, featured stores row, category chips, product grid | L | [ ] |
| S3-03 | `ProductCard.tsx` (see spec in `05_UIUX.md`) | M | [ ] |
| S3-04 | Product search page `/products/page.tsx` — search bar + category filter + results grid + infinite scroll | L | [ ] |
| S3-05 | Product detail `/products/[id]/page.tsx` — SSR, image gallery with zoom, add to cart (see `05_UIUX.md` wireframe) | L | [ ] |
| S3-06 | `useCartStore` (Zustand, from `06_FRONTEND.md`) | S | [ ] |
| S3-07 | Cart page `/cart/page.tsx` — items list, qty controls, promo code input, total | M | [ ] |
| S3-08 | Promo code validation: `GET /api/buyer/products` promo check — validate code, return discount | M | [ ] |
| S3-09 | KirimAja shipping rates API — `lib/kiriminaja.ts` helper | M | [ ] |
| S3-10 | Checkout page `/checkout/page.tsx` — address form, courier select (live rates), order summary | L | [ ] |
| S3-11 | `POST /api/buyer/orders` — create order + items + call Midtrans API + return QR data | L | [ ] |
| S3-12 | `QrisPayment.tsx` — display QR code, poll payment status every 3s | M | [ ] |
| S3-13 | `POST /api/webhooks/midtrans` — verify signature, update order status, decrement stock | L | [ ] |
| S3-14 | Order tracking `/orders/[id]/page.tsx` — `OrderTracker.tsx` stepper + `useOrderRealtime` hook | M | [ ] |
| S3-15 | Buyer profile `/profile/page.tsx` — user info, order history, `MembershipCard.tsx` | M | [ ] |
| S3-16 | Send order confirmation email via Resend on payment success | S | [ ] |

**Sprint 3 done when:** Full checkout flow works end-to-end in Midtrans sandbox. Buyer sees live tracking updates.

---

## SPRINT 4 — AI Sidebar
_Goal: AI sidebar streams responses and executes real seller actions._

| ID | Task | Size | Done |
|----|------|------|------|
| S4-01 | `useAIStore` Zustand (from `06_FRONTEND.md`) | S | [ ] |
| S4-02 | `AISidebar.tsx` — full component (see `05_UIUX.md` wireframe, use `useAI` hook) | L | [ ] |
| S4-03 | `useAI.ts` hook — SSE streaming (from `06_FRONTEND.md`) | M | [ ] |
| S4-04 | Wire `AISidebar` into `DashboardLayout` — 30% width, Framer Motion slide, toggle button | M | [ ] |
| S4-05 | `POST /api/ai/chat` — full implementation (see `04_BACKEND.md` detailed spec) | XL | [ ] |
| S4-06 | Implement all 10 AI tools in `executeTool()` — map to internal API routes | L | [ ] |
| S4-07 | Test each tool via chat: create product, update store, set location, create promo | M | [ ] |
| S4-08 | Quick action chips: "Setup Toko", "Tambah Produk", "Sync Marketplace", "Buat Promo" | S | [ ] |
| S4-09 | TanStack Query invalidation after tool execution (see `useAI.ts` in `06_FRONTEND.md`) | S | [ ] |
| S4-10 | Mobile: AI sidebar as bottom sheet (shadcn Sheet component) | M | [ ] |
| S4-11 | Persist AI sidebar open/close state to localStorage | S | [ ] |

**Sprint 4 done when:** Say "tambah produk keripik tempe 15rb stok 50" in chat → product appears in product list.

---

## SPRINT 5 — Marketplace + Instagram
_Goal: Seller can connect to Tokopedia/Shopee/Lazada and post to Instagram._

| ID | Task | Size | Done |
|----|------|------|------|
| S5-01 | Register Tokopedia Seller API app, implement OAuth flow | L | [ ] |
| S5-02 | Register Shopee Open Platform app, implement OAuth flow | L | [ ] |
| S5-03 | Register Lazada Open Platform app, implement OAuth flow | L | [ ] |
| S5-04 | `POST /api/seller/marketplace/connect` — exchange code, encrypt tokens, store | M | [ ] |
| S5-05 | Product schema mappers: `mapToTokopedia()`, `mapToShopee()`, `mapToLazada()` | L | [ ] |
| S5-06 | `POST /api/seller/marketplace/sync` — decrypt token, map product, call platform API | XL | [ ] |
| S5-07 | `GET /api/seller/marketplace/status` — return connection status per platform | S | [ ] |
| S5-08 | `/dashboard/marketplace/page.tsx` — 3 `MarketplaceCard.tsx` components | L | [ ] |
| S5-09 | Supabase Realtime: broadcast sync progress → show in `MarketplaceCard` | M | [ ] |
| S5-10 | Register Instagram Graph API app | M | [ ] |
| S5-11 | `POST /api/seller/instagram/post` — upload image to IG, publish/schedule post | L | [ ] |
| S5-12 | `/dashboard/instagram/page.tsx` — `InstagramEditor.tsx` with caption, image, schedule | L | [ ] |

**Sprint 5 done when:** Seller connects to at least one marketplace and syncs one product. Instagram post draft works.

---

## SPRINT 6 — Shipping + Promo + Admin
_Goal: Full shipping tracking and admin panel functional._

| ID | Task | Size | Done |
|----|------|------|------|
| S6-01 | `lib/kiriminaja.ts` — full API: create order, get rates, track shipment | L | [ ] |
| S6-02 | `POST /api/webhooks/kiriminaja` — update shipments table on status change | M | [ ] |
| S6-03 | `/dashboard/shipping/page.tsx` — table of active shipments, status, tracking | M | [ ] |
| S6-04 | Manual tracking input: seller enters tracking code for manual courier | S | [ ] |
| S6-05 | `GET/POST/PUT/DELETE /api/seller/promo` — full promo CRUD | M | [ ] |
| S6-06 | `/dashboard/promo/page.tsx` — promo list + `PromoForm.tsx` (code, type, value, dates) | L | [ ] |
| S6-07 | Admin layout + `AdminNav.tsx` | M | [ ] |
| S6-08 | `/admin/dashboard/page.tsx` — platform stats: total stores, products, orders, revenue | M | [ ] |
| S6-09 | `/admin/stores/page.tsx` — all stores table, feature toggle, suspend, delete | L | [ ] |
| S6-10 | `/admin/products/page.tsx` — all products table, feature toggle, delete | L | [ ] |
| S6-11 | `PUT /api/admin/stores/[id]/feature` and `PUT /api/admin/products/[id]/feature` | S | [ ] |
| S6-12 | `DELETE /api/admin/stores/[id]` and `DELETE /api/admin/products/[id]` (soft delete) | S | [ ] |
| S6-13 | `/admin/promo/page.tsx` — platform-wide promo campaigns | M | [ ] |
| S6-14 | `/admin/banners/page.tsx` — homepage banner CRUD (image upload + CTA link) | M | [ ] |
| S6-15 | `PUT /api/admin/feature-flags/[storeId]` — enable/disable features per seller | M | [ ] |

**Sprint 6 done when:** Admin can feature a store, admin promo code works at checkout, shipping tracking shows in realtime.

---

## SPRINT 7 — Subdomain + Public Store
_Goal: Every store accessible at slug.tokoblitar.com._

| ID | Task | Size | Done |
|----|------|------|------|
| S7-01 | `/store/[slug]/page.tsx` — public store page, SSR, store info + products grid | L | [ ] |
| S7-02 | Deploy Cloudflare Worker for subdomain routing (code in `04_BACKEND.md`) | M | [ ] |
| S7-03 | DNS: wildcard CNAME `*.tokoblitar.com` → Cloudflare Worker | S | [ ] |
| S7-04 | Verify `wafero.tokoblitar.com` routes to `/store/wafero` correctly | S | [ ] |
| S7-05 | SEO: `generateMetadata()` for homepage, product detail, store pages | M | [ ] |
| S7-06 | Open Graph images for product and store pages | M | [ ] |
| S7-07 | JSON-LD structured data for products (for Google Shopping) | M | [ ] |

**Sprint 7 done when:** `teststore.tokoblitar.com` loads and shows the store products.

---

## SPRINT 8 — QA + Launch
_Goal: Platform is stable, performant, and ready for first real sellers._

| ID | Task | Size | Done |
|----|------|------|------|
| S8-01 | Full buyer checkout flow test (register → browse → cart → QRIS → track) | L | [ ] |
| S8-02 | Full seller flow test (register → setup → add product → AI commands → sync) | L | [ ] |
| S8-03 | AI sidebar: test all 10 tools via chat messages | M | [ ] |
| S8-04 | Mobile audit: test every page at 375px, fix any broken layouts | L | [ ] |
| S8-05 | Lighthouse audit: target 90+ performance, fix any issues | M | [ ] |
| S8-06 | Run `tsc --noEmit` and fix ALL TypeScript errors | M | [ ] |
| S8-07 | Check all RLS policies: try accessing other user's data, confirm it fails | L | [ ] |
| S8-08 | Check all env vars are in Vercel production dashboard | S | [ ] |
| S8-09 | Seed production DB: categories, first admin account | S | [ ] |
| S8-10 | Invite 3 real UMKM sellers for beta, collect feedback | M | [ ] |
| S8-11 | Fix critical bugs from beta feedback | L | [ ] |

**Sprint 8 done when:** 3 real sellers have active stores with at least 1 product each. System has no critical bugs.

---

## OVERALL TIMELINE

| Sprint | Duration | End State |
|--------|----------|-----------|
| 0 | Week 1 | Project builds, DB migrated |
| 1 | Week 2 | Seller can register + setup store |
| 2 | Week 3 | Products + AI photo working |
| 3 | Week 4 | Buyers can checkout |
| 4 | Week 5 | AI sidebar executes actions |
| 5 | Week 6 | Marketplace sync + Instagram |
| 6 | Week 7 | Shipping + Admin panel |
| 7 | Week 8 | Subdomains live |
| 8 | Week 9-10 | QA + Beta launch |

**Total: ~86 tasks · 10 weeks · 0 infrastructure cost**
