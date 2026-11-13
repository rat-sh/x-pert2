-- ====================================================================
-- 04_batches.sql
-- Snippet ID: 78fd2a05-7541-4f8e-b355-1f9266783d3e
-- ====================================================================

create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  subject text,
  board text check (board in ('cbse', 'icse', 'jee', 'neet', 'state', 'aptitude')),
  join_code text not null unique,
  is_active boolean not null default true,
  academic_year text,
  created_at timestamptz not null default now()
);

create index if not exists idx_batches_teacher_id on public.batches(teacher_id);
create index if not exists idx_batches_join_code on public.batches(join_code);

-- Enable RLS & Policies
alter table public.batches enable row level security;

create policy "Teachers manage own batches"
  on public.batches for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

create policy "Students view batches enrolled in"
  on public.batches for select
  using (
    exists (
      select 1 from public.batch_enrollments
      where batch_enrollments.batch_id = batches.id
        and batch_enrollments.student_id = auth.uid()
        and batch_enrollments.is_active = true
    )
  );

