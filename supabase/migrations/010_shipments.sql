create table public.shipments (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null unique references public.orders(id) on delete cascade,
  courier             text not null,
  tracking_code       text,
  status              text not null default 'pending' check (status in ('pending','picked_up','in_transit','delivered','failed')),
  estimated_delivery  date,
  shipped_at          timestamptz,
  delivered_at        timestamptz,
  kiriminaja_order_id text,
  created_at          timestamptz not null default now()
);
alter table public.shipments enable row level security;
create policy "participants read" on public.shipments for select using (
  exists (select 1 from public.orders o where o.id = order_id and (
    o.buyer_id = auth.uid() or
    exists (select 1 from public.stores where id = o.store_id and user_id = auth.uid())
  ))
);
