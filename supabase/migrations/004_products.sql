create table public.products (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name        text not null,
  description text,
  price       numeric(12,2) not null,
  stock       int not null default 0,
  weight_gram int not null default 0,
  is_featured bool not null default false,
  status      text not null default 'draft' check (status in ('active','draft','archived')),
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
alter table public.products enable row level security;
create policy "public read active" on public.products for select using (status = 'active' and deleted_at is null);
create policy "seller manage own" on public.products for all using (
  exists (select 1 from public.stores where id = store_id and user_id = auth.uid())
);
create policy "admin all" on public.products for all using (
  (select role from public.users where id = auth.uid()) = 'admin'
);
