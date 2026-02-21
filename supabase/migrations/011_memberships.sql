create table public.memberships (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique references public.users(id) on delete cascade,
  tier         text not null default 'bronze' check (tier in ('bronze','silver','gold')),
  points       int not null default 0,
  member_since timestamptz not null default now()
);
alter table public.memberships enable row level security;
create policy "read own" on public.memberships for select using (auth.uid() = user_id);
