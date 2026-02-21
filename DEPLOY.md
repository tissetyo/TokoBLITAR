# TokoBLITAR — Deployment Guide

## Step 1: Supabase Database Setup

Buka **Supabase Dashboard** → Project → **SQL Editor**, lalu jalankan file-file ini **secara berurutan**:

```
supabase/migrations/001_users.sql
supabase/migrations/002_stores.sql
supabase/migrations/003_categories.sql
supabase/migrations/004_products.sql
supabase/migrations/005_product_images.sql
supabase/migrations/006_marketplace_connections.sql
supabase/migrations/007_marketplace_products.sql
supabase/migrations/008_promo_codes.sql
supabase/migrations/009_orders.sql
supabase/migrations/010_shipments.sql
supabase/migrations/011_memberships.sql
supabase/migrations/012_instagram_posts.sql
supabase/migrations/013_ai_sessions.sql
```

Setelah itu jalankan:
```
supabase/functions/decrement_stock.sql
supabase/seed_categories.sql
```

### Buat Admin User
Setelah register akun di web, jalankan di SQL Editor:
```sql
UPDATE public.users SET role = 'admin' WHERE email = 'emailkamu@gmail.com';
```

---

## Step 2: Deploy ke Vercel

### 2a. Import Repo
1. Buka [vercel.com/new](https://vercel.com/new)
2. Import repo **tissetyo/TokoBLITAR** dari GitHub
3. Framework preset: **Next.js** (otomatis terdeteksi)
4. Root directory: `./` (default)
5. **Jangan deploy dulu** — set env vars dulu!

### 2b. Tambahkan Environment Variables
Di Vercel → Settings → Environment Variables, tambahkan **semua** ini:

| Variable | Contoh / Dimana Dapat |
|----------|----------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `NEXT_PUBLIC_APP_URL` | `https://tokoblitar.vercel.app` (ganti sesuai domain) |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `MIDTRANS_SERVER_KEY` | [dashboard.midtrans.com](https://dashboard.midtrans.com) |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Midtrans Dashboard |
| `BITESHIP_API_KEY` | `biteship_test.xxxx` dari dashboard Biteship |
| `REPLICATE_API_TOKEN` | [replicate.com](https://replicate.com) (untuk AI photo) |

**Opsional** (boleh kosong dulu):
| Variable | Keterangan |
|----------|-----------|
| `CLOUDFLARE_ACCOUNT_ID` | Untuk R2 image upload |
| `CLOUDFLARE_R2_ACCESS_KEY` | R2 access key |
| `CLOUDFLARE_R2_SECRET_KEY` | R2 secret key |
| `CLOUDFLARE_R2_BUCKET` | `tokoblitar-assets` |
| `CLOUDFLARE_R2_PUBLIC_URL` | R2 public URL |
| `RESEND_API_KEY` | Untuk email notifications |
| `INSTAGRAM_APP_ID` | Meta Developer Console |
| `INSTAGRAM_APP_SECRET` | Meta Developer Console |
| `ENCRYPTION_KEY` | `openssl rand -hex 32` |
| `UPSTASH_REDIS_REST_URL` | Upstash dashboard |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash dashboard |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Cloud Console |

### 2c. Deploy!
Klik **Deploy**. Build harusnya berhasil (~44 routes).

---

## Step 3: Konfigurasi Webhook

### Midtrans Webhook
1. Buka [dashboard.midtrans.com](https://dashboard.midtrans.com)
2. Settings → Configuration → Notification URL
3. Set: `https://DOMAIN-KAMU.vercel.app/api/webhooks/midtrans`

### Supabase Auth Redirect
1. Buka Supabase → Authentication → URL Configuration
2. Set Site URL: `https://DOMAIN-KAMU.vercel.app`
3. Tambahkan redirect URL: `https://DOMAIN-KAMU.vercel.app/**`

---

## Step 4: Post-Deploy Checklist

Setelah deploy berhasil, test flow ini:

- [ ] Buka homepage → produk/kategori terload  
- [ ] Register akun baru → login → redirect ke dashboard
- [ ] Setup toko → isi nama, slug, deskripsi
- [ ] Tambah produk → upload gambar → save
- [ ] Buka AI Sidebar → ketik "tampilkan produk saya"
- [ ] Buka marketplace → coba connect
- [ ] Buka `/products` → search + filter
- [ ] Tambah ke cart → checkout → isi alamat + kode pos → ongkir muncul
- [ ] Buka `/store/SLUG-KAMU` → toko + produk terlihat
- [ ] Login sebagai admin → `/admin/dashboard` → stats terload
- [ ] Admin → tandai toko/produk unggulan
