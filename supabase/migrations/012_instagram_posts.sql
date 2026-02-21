create table public.instagram_posts (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  caption      text,
  image_url    text,
  ig_post_id   text,
  status       text not null default 'draft' check (status in ('draft','published','failed')),
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at   timestamptz not null default now()
);
alter table public.instagram_posts enable row level security;
create policy "seller manage own" on public.instagram_posts for all using (
  exists (select 1 from public.stores where id = store_id and user_id = auth.uid())
);
