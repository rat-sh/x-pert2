-- ====================================================================
-- 01_users.sql
-- Snippet ID: 712dc269-ed69-4b8a-b8cb-b8c5a46a1bc2
-- ====================================================================

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('teacher', 'student', 'parent')),
  email text,
  phone text,
  preferred_language text default 'en',
  date_of_birth date,
  pin_hash text,
  pin_set_at timestamptz,
  created_at timestamptz not null default now()
);

-- Trigger function to automatically create a public.users profile on auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  v_full_name text;
  v_role text;
  v_phone text;
begin
  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  v_role := coalesce(new.raw_user_meta_data->>'role', 'student');
  v_phone := new.raw_user_meta_data->>'phone';

  insert into public.users (id, full_name, role, email, phone)
  values (new.id, v_full_name, v_role, new.email, v_phone)
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email,
    phone = coalesce(excluded.phone, public.users.phone);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enable RLS & Policies
alter table public.users enable row level security;

create policy "Users can view all user profiles"
  on public.users for select
  using (true);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.users for insert
  with check (auth.uid() = id);

