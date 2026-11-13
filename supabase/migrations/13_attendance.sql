-- 13_attendance.sql
-- Attendance tracking for students within batches

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  date date not null default current_date,
  status text not null check (status in ('present', 'absent')),
  marked_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  constraint unique_student_batch_date unique (batch_id, student_id, date)
);

-- Indexes
create index if not exists idx_attendance_batch_date on public.attendance_records(batch_id, date);
create index if not exists idx_attendance_student on public.attendance_records(student_id);

-- Enable RLS
alter table public.attendance_records enable row level security;

-- Policies
create policy "Teachers can manage attendance for their batches"
  on public.attendance_records
  for all
  to authenticated
  using (
    exists (
      select 1 from public.batches
      where batches.id = attendance_records.batch_id
      and batches.teacher_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.batches
      where batches.id = attendance_records.batch_id
      and batches.teacher_id = auth.uid()
    )
  );

create policy "Students can view their own attendance records"
  on public.attendance_records
  for select
  to authenticated
  using (student_id = auth.uid());

