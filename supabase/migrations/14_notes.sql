-- 14_notes.sql
-- Class notes and study document references

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  title text not null,
  chapter_tag text,
  file_url text not null,
  file_type text not null default 'pdf' check (file_type in ('pdf', 'image', 'link')),
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_notes_batch_id on public.notes(batch_id);
create index if not exists idx_notes_teacher_id on public.notes(teacher_id);

-- Enable RLS
alter table public.notes enable row level security;

-- Policies
create policy "Teachers can manage their own notes"
  on public.notes
  for all
  to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

create policy "Enrolled students can view notes"
  on public.notes
  for select
  to authenticated
  using (
    exists (
      select 1 from public.batch_enrollments
      where batch_enrollments.batch_id = notes.batch_id
      and batch_enrollments.student_id = auth.uid()
    )
  );

