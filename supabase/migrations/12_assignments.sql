-- 12_assignments.sql
-- Assignments and Student Submissions

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  title text not null,
  description text,
  deadline timestamptz not null,
  max_marks numeric not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  file_url text,
  file_name text,
  submitted_at timestamptz not null default now(),
  is_late boolean not null default false,
  score numeric,
  feedback text,
  graded_at timestamptz,
  constraint unique_assignment_student unique (assignment_id, student_id)
);

-- Indexes
create index if not exists idx_assignments_batch_id on public.assignments(batch_id);
create index if not exists idx_assignments_teacher_id on public.assignments(teacher_id);
create index if not exists idx_assignment_submissions_assignment on public.assignment_submissions(assignment_id);
create index if not exists idx_assignment_submissions_student on public.assignment_submissions(student_id);

-- Enable RLS
alter table public.assignments enable row level security;
alter table public.assignment_submissions enable row level security;

-- Assignments Policies
create policy "Teachers can manage assignments"
  on public.assignments
  for all
  to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

create policy "Enrolled students can view assignments"
  on public.assignments
  for select
  to authenticated
  using (
    exists (
      select 1 from public.batch_enrollments
      where batch_enrollments.batch_id = assignments.batch_id
      and batch_enrollments.student_id = auth.uid()
    )
  );

-- Assignment Submissions Policies
create policy "Students can view their own submissions"
  on public.assignment_submissions
  for select
  to authenticated
  using (student_id = auth.uid());

create policy "Students can submit their assignments"
  on public.assignment_submissions
  for insert
  to authenticated
  with check (student_id = auth.uid());

create policy "Students can update their submissions before grading"
  on public.assignment_submissions
  for update
  to authenticated
  using (student_id = auth.uid() and score is null)
  with check (student_id = auth.uid() and score is null);

create policy "Teachers can view submissions for their assignments"
  on public.assignment_submissions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.assignments
      where assignments.id = assignment_submissions.assignment_id
      and assignments.teacher_id = auth.uid()
    )
  );

create policy "Teachers can grade submissions for their assignments"
  on public.assignment_submissions
  for update
  to authenticated
  using (
    exists (
      select 1 from public.assignments
      where assignments.id = assignment_submissions.assignment_id
      and assignments.teacher_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.assignments
      where assignments.id = assignment_submissions.assignment_id
      and assignments.teacher_id = auth.uid()
    )
  );

