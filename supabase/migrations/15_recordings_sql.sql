-- 15_recordings_sql.sql
-- Class video recordings and lecture archives

create table if not exists public.recordings (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  title text not null,
  chapter_tag text,
  video_url text not null,
  recorded_on date not null default current_date,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_recordings_batch_id on public.recordings(batch_id);
create index if not exists idx_recordings_teacher_id on public.recordings(teacher_id);

-- Enable RLS
alter table public.recordings enable row level security;

-- Policies
create policy "Teachers can manage their own recordings"
  on public.recordings
  for all
  to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

create policy "Enrolled students can view recordings"
  on public.recordings
  for select
  to authenticated
  using (
    exists (
      select 1 from public.batch_enrollments
      where batch_enrollments.batch_id = recordings.batch_id
      and batch_enrollments.student_id = auth.uid()
    )
  );

