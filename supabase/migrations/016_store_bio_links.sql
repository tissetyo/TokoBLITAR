-- Enable store appearance customizations
alter table public.stores
  add column if not exists web_enabled boolean not null default true,
  add column if not exists bio_enabled boolean not null default false,
  add column if not exists theme varchar(50) not null default 'minimal_light',
  add column if not exists font_family varchar(50) not null default 'inter',
  add column if not exists bio_description text;

-- Create store_links table for Link in Bio pages
create table if not exists public.store_links (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  title text not null,
  url text not null,
  icon_name text,
  is_active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.store_links enable row level security;

-- Policies for store_links
create policy "public read active links" on public.store_links for select 
  using (is_active = true);

create policy "seller manage own links" on public.store_links for all 
  using (
    store_id in (
      select id from public.stores where user_id = auth.uid()
    )
  );

create policy "admin all links" on public.store_links for all 
  using (
    (select role from public.users where id = auth.uid()) = 'admin'
  );

-- Enable the moddatetime extension if it doesn't exist
create extension if not exists moddatetime;

-- Create updated_at trigger for store_links
create trigger handle_updated_at before update on public.store_links 
  for each row execute procedure moddatetime (updated_at);
