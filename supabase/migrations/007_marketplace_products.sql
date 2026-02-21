create table public.marketplace_products (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid not null references public.products(id) on delete cascade,
  connection_id       uuid not null references public.marketplace_connections(id) on delete cascade,
  platform_product_id text,
  platform_url        text,
  sync_status         text not null default 'pending' check (sync_status in ('synced','pending','error')),
  last_synced_at      timestamptz,
  created_at          timestamptz not null default now()
);
alter table public.marketplace_products enable row level security;
create policy "seller read own" on public.marketplace_products for select using (
  exists (
    select 1 from public.products p
    join public.stores s on s.id = p.store_id
    where p.id = product_id and s.user_id = auth.uid()
  )
);
