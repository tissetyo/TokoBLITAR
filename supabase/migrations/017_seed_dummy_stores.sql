-- 017_seed_dummy_stores.sql
-- Run this in your Supabase SQL Editor to populate dummy stores and products

-- WARNING: This will NOT create the Auth users. You must create the 3 users in the Authentication -> Users dashboard first,
-- assign them the UUIDs locally, or let Supabase generate them and you update the UUIDs below.
-- For ease of testing, we will use fixed UUIDs for the dummy users if they don't exist.

-- 1. Create Dummy Users in auth.users (Requires superuser privileges, usually skip and create via UI, 
-- but we try to insert if allowed, otherwise just link to dummy IDs and you can't login but can view public pages)

-- We will insert into public.users to satisfy foreign keys
INSERT INTO public.users (id, full_name, role)
VALUES 
  ('ecc0678c-e438-4e06-a66f-cb43fe2daec2', 'Budi Minimalis', 'seller'),
  ('14745212-eb5a-4705-a61b-c1b6d28e17ba', 'Siti Cyberpunk', 'seller'),
  ('a5c9366d-eb16-485e-913a-ba8a5cf47fd0', 'Agus Retro', 'seller')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert 3 Distinct Stores
INSERT INTO public.stores (id, user_id, name, slug, description, address, status, web_enabled, bio_enabled, theme, font_family, bio_description)
VALUES
  (
    '10000000-0000-0000-0000-000000000001', 
    'ecc0678c-e438-4e06-a66f-cb43fe2daec2', 
    'Kopi Senja', 
    'kopi-senja', 
    'Biji kopi pilihan dari lereng Gunung Kelud.', 
    'Jl. Cemara 12, Blitar, Jawa Timur 66112', 
    'active', true, true, 
    'minimal_light', 'font-sans',
    'Menyeduh cerita di setiap cangkir. ☕ Kirim ke seluruh Indonesia!'
  ),
  (
    '20000000-0000-0000-0000-000000000002', 
    '14745212-eb5a-4705-a61b-c1b6d28e17ba', 
    'Neon Gadget', 
    'neon-gadget', 
    'Aksesoris gaming dan PC rakitan masa depan.', 
    'Ruko Cyber 99, Blitar, Jawa Timur 66113', 
    'active', true, true, 
    'cyberpunk', 'font-mono',
    'UPGRADE YOUR RIG. 👾 100% Original & Garansi Resmi.'
  ),
  (
    '30000000-0000-0000-0000-000000000003', 
    'a5c9366d-eb16-485e-913a-ba8a5cf47fd0', 
    'Batik Mbah Kakung', 
    'batik-lawas', 
    'Koleksi batik tulis kuno dan kontemporer warisan leluhur.', 
    'Desa Batik 4, Blitar, Jawa Timur 66114', 
    'active', true, true, 
    'retro_warm', 'font-serif',
    'Melestarikan budaya benang dan malam. 🧶'
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Bio Links
INSERT INTO public.store_links (store_id, title, url, position)
VALUES
  -- Kopi Senja
  ('10000000-0000-0000-0000-000000000001', 'Beli via WhatsApp', 'https://wa.me/6281234567890', 0),
  ('10000000-0000-0000-0000-000000000001', 'Official Instagram', 'https://instagram.com/kopisenja', 1),
  -- Neon Gadget
  ('20000000-0000-0000-0000-000000000002', 'Tokopedia Store', 'https://tokopedia.com/neongadget', 0),
  ('20000000-0000-0000-0000-000000000002', 'Join Discord Guild', 'https://discord.gg/neongadget', 1),
  ('20000000-0000-0000-0000-000000000002', 'Racun TikTok', 'https://tiktok.com/@neongadget', 2),
  -- Batik Mbah Kakung
  ('30000000-0000-0000-0000-000000000003', 'Katalog Shopee', 'https://shopee.co.id/batiklawas', 0),
  ('30000000-0000-0000-0000-000000000003', 'Lokasi Butik (Maps)', 'https://maps.google.com', 1)
ON CONFLICT DO NOTHING;

-- 4. Insert Products (First, ensure categories exist or use generic ones)
-- We'll assume category UUIDs from earlier seed exists, or we leave them null if your schema allows.
-- For safety, we'll insert a dummy category first if needed.
INSERT INTO public.categories (id, name, slug) VALUES 
('99999999-9999-9999-9999-999999999999', 'Lain-lain', 'lain-lain')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, store_id, category_id, name, description, price, stock, weight_gram, status)
VALUES
  -- Store 1 Products
  ('10000000-0000-0000-1000-000000000001', '10000000-0000-0000-0000-000000000001', '99999999-9999-9999-9999-999999999999', 
   'Kopi Arabica Kelud 200g', 'Roasted medium dark, notes of chocolate & caramel.', 65000, 50, 250, 'active'),
  ('10000000-0000-0000-1000-000000000002', '10000000-0000-0000-0000-000000000001', '99999999-9999-9999-9999-999999999999', 
   'V60 Dripper Filter Set', 'Alat seduh manual V60 lengkap dengan 40 lembar kertas filter.', 120000, 15, 500, 'active'),
   
  -- Store 2 Products
  ('20000000-0000-0000-2000-000000000001', '20000000-0000-0000-0000-000000000002', '99999999-9999-9999-9999-999999999999', 
   'Mechanical Keyboard RGB 65%', 'Switch red linear, hot-swappable, full RGB, battery 4000mAh.', 850000, 10, 1200, 'active'),
  ('20000000-0000-0000-2000-000000000002', '20000000-0000-0000-0000-000000000002', '99999999-9999-9999-9999-999999999999', 
   'Mousepad Deskmat Hoshimachi', 'Ukuran 900x400x4mm, speed type, pinggiran dijahit rapi.', 150000, 30, 800, 'active'),

  -- Store 3 Products
  ('30000000-0000-0000-3000-000000000001', '30000000-0000-0000-0000-000000000003', '99999999-9999-9999-9999-999999999999', 
   'Kain Batik Tulis Motif Kawung', 'Batik tulis asli buatan tangan pengrajin sepuh Blitar. Kain primisima.', 450000, 5, 400, 'active'),
  ('30000000-0000-0000-3000-000000000002', '30000000-0000-0000-0000-000000000003', '99999999-9999-9999-9999-999999999999', 
   'Kemeja Pria Lengan Pendek Sogan', 'Kemeja kerja motif sogan klasik. Ukuran L dan XL.', 175000, 20, 350, 'active')
ON CONFLICT DO NOTHING;

-- 5. Insert Product Images (Using Unsplash placeholders)
INSERT INTO public.product_images (product_id, url, is_primary)
VALUES
  ('10000000-0000-0000-1000-000000000001', 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=800', true),
  ('10000000-0000-0000-1000-000000000002', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800', true),
  ('20000000-0000-0000-2000-000000000001', 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800', true),
  ('20000000-0000-0000-2000-000000000002', 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800', true),
  ('30000000-0000-0000-3000-000000000001', 'https://images.unsplash.com/photo-1544256718-3baf237f39df?w=800', true),
  ('30000000-0000-0000-3000-000000000002', 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800', true)
ON CONFLICT DO NOTHING;
