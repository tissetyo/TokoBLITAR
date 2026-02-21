create table public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'buyer' check (role in ('buyer','seller','admin')),
  full_name  text,
  avatar_url text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
alter table public.users enable row level security;
create policy "read own" on public.users for select using (auth.uid() = id);
create policy "update own" on public.users for update using (auth.uid() = id);

-- Auto-create on signup
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.users (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();
