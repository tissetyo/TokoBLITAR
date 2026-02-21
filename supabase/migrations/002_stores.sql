create table public.stores (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  name             text not null,
  slug             text not null unique,
  description      text,
  logo_url         text,
  banner_url       text,
  address          text,
  lat              float8,
  lng              float8,
  google_maps_url  text,
  instagram_handle text,
  status           text not null default 'active' check (status in ('active','inactive','suspended')),
  created_at       timestamptz not null default now(),
  deleted_at       timestamptz
);
alter table public.stores enable row level security;
create policy "public read active" on public.stores for select using (status = 'active' and deleted_at is null);
create policy "seller manage own" on public.stores for all using (auth.uid() = user_id);
create policy "admin all" on public.stores for all using (
  (select role from public.users where id = auth.uid()) = 'admin'
);
