# 05_UIUX.md
> Build UI exactly as described here. Use the design tokens. Follow the wireframes. No creative deviation without instruction.

---

## DESIGN TOKENS — ADD TO globals.css

```css
:root {
  --color-primary:  #1A1A2E;
  --color-accent:   #E94560;
  --color-surface:  #FFFFFF;
  --color-bg:       #F6F6F6;
  --color-muted:    #9E9E9E;
  --color-success:  #2E7D32;
  --color-warning:  #E65100;
  --color-error:    #C62828;
  --color-border:   #E0E0E0;

  --font-sans: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --space-1: 4px;   --space-2: 8px;   --space-3: 16px;
  --space-4: 24px;  --space-5: 32px;  --space-6: 48px;
  --space-7: 64px;

  --radius-sm: 6px;  --radius-md: 10px;  --radius-lg: 16px;  --radius-full: 9999px;
}
```

---

## TYPOGRAPHY

| Use | Class |
|-----|-------|
| Page title | `text-3xl font-bold text-[--color-primary]` |
| Section header | `text-2xl font-semibold text-[--color-primary]` |
| Card title | `text-lg font-semibold` |
| Body | `text-sm text-gray-700` |
| Meta / label | `text-xs text-[--color-muted]` |
| Price | `text-xl font-bold text-[--color-accent]` |
| Code / tracking | `font-mono text-sm` |

---

## DASHBOARD LAYOUT — EXACT STRUCTURE

```
┌──────────────────────────────────────────────────────────────────┐
│ HEADER: Logo | Page title                          User avatar   │
├──────────┬───────────────────────────────────┬───────────────────┤
│          │                                   │                   │
│ LEFT NAV │     MAIN CONTENT                  │   AI SIDEBAR      │
│ 240px    │     flex-1                        │   320px           │
│ fixed    │     overflow-y-auto               │   collapsible     │
│          │     p-6                           │                   │
│          │                                   │                   │
└──────────┴───────────────────────────────────┴───────────────────┘
```

**Left Nav links (seller):**
- 🏪 Toko Saya → `/dashboard/store`
- 📦 Produk → `/dashboard/products`
- 🛒 Pesanan → `/dashboard/orders`
- 🚚 Pengiriman → `/dashboard/shipping`
- 🔗 Marketplace → `/dashboard/marketplace`
- 📸 Instagram → `/dashboard/instagram`
- 🎁 Promo → `/dashboard/promo`
- ⚙️ Pengaturan → `/dashboard/settings`

**AI Sidebar toggle:** floating button at right edge of main content. Icon: sparkles. Click to slide sidebar in/out (Framer Motion, 250ms ease-out).

**Mobile (< 768px):** bottom tab bar replaces left nav. AI sidebar becomes FAB button (bottom-right) that opens a bottom sheet.

---

## COMPONENT SPECS

### ProductCard
```
Width: auto (grid item)
Aspect ratio image: 1:1, object-cover, rounded-lg
Show: primary image, product name (2 lines max, truncate), price in accent color
If promo active: show strikethrough original price + promo badge
Store avatar + name if showStore=true
Hover (desktop): quick "Tambah" button overlay at bottom
Mobile: full card tappable → product detail
```

### StatCard (dashboard overview)
```
Layout: icon (left) + label + value (right)
Icons: use lucide-react
Color accent strip on left border
Examples: Total Pendapatan, Pesanan Baru, Total Produk, Stok Habis
```

### StatusBadge
```
active    → green bg, "Aktif"
draft     → gray bg, "Draft"
archived  → red/muted bg, "Diarsipkan"
pending   → yellow bg, "Menunggu"
paid      → green bg, "Dibayar"
shipped   → blue bg, "Dikirim"
delivered → green bg, "Diterima"
error     → red bg, "Error"
synced    → green bg, "Tersinkron"
```

### MarketplaceCard
```
Row layout: [Platform logo 40px] [Name + status badge] [Last sync time] [Action buttons]
Buttons: Hubungkan / Sinkron Semua / Putuskan
Show progress bar during sync (Supabase Realtime updates)
Platforms: Tokopedia (green), Shopee (orange), Lazada (purple)
```

### PhotoEnhancer
```
State 1 - Upload: drag-drop zone, shows preview on drop
State 2 - Processing: skeleton + "AI sedang memproses..." spinner (10-30s)
State 3 - Done: side-by-side | Original | Enhanced |
           Each image: [✓ Gunakan] [✗ Abaikan] buttons
```

### AI Sidebar
```
┌──────────────────────────┐
│ ✨ TokoBLITAR AI  [hide] │  ← header, sticky
├──────────────────────────┤
│                          │
│  [chat messages here]    │  ← scrollable flex-1
│                          │
│  User bubble: right      │
│  AI bubble: left, with   │
│    avatar (robot icon)   │
│                          │
│  Tool execution shows    │
│  as: "⚙️ Menjalankan..." │
│  then "✅ Berhasil!"      │
│                          │
├──────────────────────────┤
│ [Setup Toko] [+ Produk]  │  ← quick chips, wrap
│ [Sync Tokopedia]         │
├──────────────────────────┤
│ [Ketik pesan...    ] [➤] │  ← input, sticky
└──────────────────────────┘
```

---

## PAGE WIREFRAMES

### Homepage (buyer)
```
[STICKY NAV: Logo | Search | Cart(n) | Masuk]

[HERO CAROUSEL: 3 banners, auto-scroll 5s, dots nav]

[FEATURED STORES]
Toko Pilihan →
[Card][Card][Card][Card]  ← horizontal scroll on mobile

[KATEGORI]
[Makanan][Minuman][Kerajinan][Fashion][Lainnya]  ← chips

[PRODUK UNGGULAN]
[Card][Card][Card]
[Card][Card][Card]  ← 3 col desktop, 2 col mobile

[SEMUA PRODUK]
[Card][Card][Card]  ← infinite scroll
```

### Product Detail (SSR)
```
[breadcrumb: Home > Kategori > Produk]

[LEFT 60%]                    [RIGHT 40%]
[Main image - zoomable]       [Product name - bold large]
[Thumbnail row x4]            [Store chip: avatar + name →]
                              [⭐ Rating | Terjual 123]
                              [──────────────────────]
                              [Rp 15.000]
                              [~~Rp 20.000~~ -25%]  ← if promo
                              [Stok: 48 tersisa]
                              [Qty: [ − ] 1 [ + ]]
                              [────────────────────]
                              [🛒 Tambah ke Keranjang]  ← accent
                              [⚡ Beli Sekarang]

[TABS: Deskripsi | Spesifikasi | Ulasan]
[tab content]

[Produk Lain dari Toko Ini]
[Card][Card][Card][Card]  ← horizontal scroll
```

### Seller Dashboard
```
[STAT CARDS ROW]
[Pendapatan Hari Ini] [Pesanan Baru] [Total Produk] [Stok Habis]

[PESANAN TERBARU]
Table: No. | Pembeli | Produk | Total | Status | Aksi

[RIGHT SIDE: AI SIDEBAR 30%]
```

### Checkout
```
Step 1: Alamat Pengiriman
  [form: nama, telepon, alamat, kota, kode pos]

Step 2: Pilih Kurir
  [KirimAja options: JNE Rp12.000 (3-4 hari) | J&T Rp10.000 | SiCepat Rp9.000]
  ← rates fetched from KirimAja API

Step 3: Ringkasan & Pembayaran
  [order items]
  [promo code input]
  [total breakdown: subtotal, ongkir, diskon, total]
  [QRIS: scan QR code]
  [Bayar Sekarang button]
```

### Order Tracking
```
[Order #12345]

[STEPPER - vertical]
✅ Pesanan Dibuat       14 Feb 10:00
✅ Pembayaran Diterima  14 Feb 10:05
✅ Sedang Diproses      14 Feb 11:00
🔄 Dalam Pengiriman     14 Feb 14:00   ← current
⬜ Pesanan Diterima     (estimasi 16 Feb)

[Kurir: JNE | Tracking: JNE123456]
[Live tracking timeline from KirimAja]
```

---

## ANIMATIONS

```
Page transitions:       fade + slide up 200ms ease-out (Framer Motion)
AI sidebar open/close:  slide from right 250ms ease-out
Product card hover:     scale(1.02) + shadow elevation 150ms
Toast:                  slide in top-right 200ms
Button press:           scale(0.97) 100ms
Skeleton loading:       pulse animation on all async content
```

---

## BREAKPOINTS

| Name | Min | Changes |
|------|-----|---------|
| mobile | 375px | 1-col layout, bottom tab nav |
| sm | 640px | 2-col product grid |
| md | 768px | Sidebar nav visible |
| lg | 1024px | 3-col grid, AI sidebar always shows |
| xl | 1280px | Max container 1200px centered |

---

## SHADCN COMPONENTS TO INSTALL

```bash
npx shadcn@latest add button card input textarea select combobox
npx shadcn@latest add dialog sheet drawer tooltip popover
npx shadcn@latest add table badge avatar skeleton tabs
npx shadcn@latest add toast sonner progress
npx shadcn@latest add form label separator
```
