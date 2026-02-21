create table public.ai_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  messages   jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ai_sessions enable row level security;
create policy "manage own" on public.ai_sessions for all using (auth.uid() = user_id);
