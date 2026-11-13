-- ====================================================================
-- 07_exams.sql
-- Snippet ID: 1cb11cea-694d-4925-bb56-aa8de68ad3cc
-- ====================================================================

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references public.batches(id) on delete set null,
  teacher_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  subject text,
  exam_type text not null default 'test' check (exam_type in ('test', 'pyq_practice', 'mock')),
  board_tag text,
  duration_minutes integer not null default 60,
  total_marks numeric not null default 0,
  negative_marking boolean not null default false,
  negative_marks_per_wrong numeric not null default 0,
  exam_key text unique,
  exam_pin text,
  share_link text,
  batch_ids uuid[] default array[]::uuid[],
  is_published boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'active', 'completed', 'archived')),
  allow_pyq boolean not null default false,
  no_reverse_back boolean not null default false,
  per_question_time_seconds integer,
  is_instant boolean not null default false,
  instant_expires_at timestamptz,
  scheduled_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_exams_teacher_id on public.exams(teacher_id);
create index if not exists idx_exams_batch_id on public.exams(batch_id);
create index if not exists idx_exams_status on public.exams(status);
create index if not exists idx_exams_key on public.exams(exam_key);

-- Enable RLS & Policies
alter table public.exams enable row level security;

create policy "Teachers manage own exams"
  on public.exams for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

create policy "Students view published exams for enrolled batches"
  on public.exams for select
  using (
    is_published = true and (
      exists (
        select 1 from public.batch_enrollments
        where batch_enrollments.batch_id = exams.batch_id
          and batch_enrollments.student_id = auth.uid()
          and batch_enrollments.is_active = true
      )
      or (exams.batch_id is null and auth.uid() is not null)
    )
  );

