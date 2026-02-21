create table public.marketplace_connections (
  id                uuid primary key default gen_random_uuid(),
  store_id          uuid not null references public.stores(id) on delete cascade,
  platform          text not null check (platform in ('tokopedia','shopee','lazada')),
  access_token_enc  text,
  refresh_token_enc text,
  shop_id           text,
  status            text not null default 'disconnected' check (status in ('connected','disconnected','error')),
  last_sync_at      timestamptz,
  created_at        timestamptz not null default now(),
  unique(store_id, platform)
);
alter table public.marketplace_connections enable row level security;
create policy "seller manage own" on public.marketplace_connections for all using (
  exists (select 1 from public.stores where id = store_id and user_id = auth.uid())
);
