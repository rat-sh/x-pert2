-- ====================================================================
-- 02_teachers.sql
-- Snippet ID: 451f0cc3-18bf-4486-b202-92dbc4169258
-- ====================================================================

create table if not exists public.teachers (
  id uuid primary key references public.users(id) on delete cascade,
  institution_name text,
  upi_id text,
  upi_qr_url text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  plan_expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- Trigger: When a user with role 'teacher' is created, initialize the teachers row
create or replace function public.handle_new_teacher()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.role = 'teacher' then
    insert into public.teachers (id, plan)
    values (new.id, 'free')
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_user_teacher_created on public.users;
create trigger on_user_teacher_created
  after insert on public.users
  for each row execute function public.handle_new_teacher();

-- Enable RLS & Policies
alter table public.teachers enable row level security;

create policy "Anyone can view teacher info"
  on public.teachers for select
  using (true);

create policy "Teachers can update own details"
  on public.teachers for update
  using (auth.uid() = id);

create policy "Teachers can insert own record"
  on public.teachers for insert
  with check (auth.uid() = id);

