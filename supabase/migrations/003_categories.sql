create table public.categories (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  slug      text not null unique,
  icon_url  text,
  parent_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;
create policy "anyone read" on public.categories for select using (true);
create policy "admin manage" on public.categories for all using (
  (select role from public.users where id = auth.uid()) = 'admin'
);
