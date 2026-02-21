create table public.promo_codes (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid references public.stores(id) on delete cascade,
  created_by   uuid not null references public.users(id),
  code         text not null unique,
  type         text not null check (type in ('percentage','fixed')),
  value        numeric(10,2) not null,
  min_purchase numeric(12,2) not null default 0,
  max_uses     int,
  used_count   int not null default 0,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  is_active    bool not null default true,
  created_at   timestamptz not null default now()
);
alter table public.promo_codes enable row level security;
create policy "public read valid" on public.promo_codes for select using (
  is_active = true and now() between starts_at and ends_at
);
create policy "creator manage" on public.promo_codes for all using (auth.uid() = created_by);
