create table public.product_images (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products(id) on delete cascade,
  url            text not null,
  is_primary     bool not null default false,
  is_ai_enhanced bool not null default false,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now()
);
alter table public.product_images enable row level security;
create policy "public read" on public.product_images for select using (true);
create policy "seller manage own" on public.product_images for all using (
  exists (
    select 1 from public.products p
    join public.stores s on s.id = p.store_id
    where p.id = product_id and s.user_id = auth.uid()
  )
);
