create table public.orders (
  id                 uuid primary key default gen_random_uuid(),
  buyer_id           uuid not null references public.users(id),
  store_id           uuid not null references public.stores(id),
  promo_code_id      uuid references public.promo_codes(id),
  status             text not null default 'pending' check (status in ('pending','paid','processing','shipped','delivered','cancelled','refunded')),
  total_amount       numeric(12,2) not null,
  discount_amount    numeric(12,2) not null default 0,
  payment_method     text,
  payment_gateway_id text,
  source             text not null default 'web' check (source in ('web','marketplace')),
  shipping_address   jsonb,
  created_at         timestamptz not null default now()
);
create table public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity   int not null,
  unit_price numeric(12,2) not null,
  subtotal   numeric(12,2) not null,
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
create policy "buyer read own" on public.orders for select using (auth.uid() = buyer_id);
create policy "seller read store orders" on public.orders for select using (
  exists (select 1 from public.stores where id = store_id and user_id = auth.uid())
);
create policy "buyer create" on public.orders for insert with check (auth.uid() = buyer_id);
create policy "service update" on public.orders for update using (true);
create policy "participants read items" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and (
    o.buyer_id = auth.uid() or
    exists (select 1 from public.stores where id = o.store_id and user_id = auth.uid())
  ))
);
