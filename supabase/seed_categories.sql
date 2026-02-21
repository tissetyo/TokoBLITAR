-- Seed categories for TokoBLITAR
-- These represent the main UMKM product categories in Blitar

INSERT INTO public.categories (name, slug, icon_url) VALUES
  ('Makanan', 'makanan', NULL),
  ('Minuman', 'minuman', NULL),
  ('Kerajinan', 'kerajinan', NULL),
  ('Fashion', 'fashion', NULL),
  ('Pertanian', 'pertanian', NULL),
  ('Lainnya', 'lainnya', NULL)
ON CONFLICT (slug) DO NOTHING;
