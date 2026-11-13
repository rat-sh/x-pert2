-- 11_calendar_schedules.sql
-- Calendar schedules for classes, lectures, and exams

create table if not exists public.calendar_schedules (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  batch_name text not null,
  subject text not null,
  schedule_date date not null,
  start_time time not null,
  duration text not null default '1 hour',
  type text not null default 'class' check (type in ('class', 'exam')),
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_calendar_schedules_teacher_id on public.calendar_schedules(teacher_id);
create index if not exists idx_calendar_schedules_date on public.calendar_schedules(schedule_date);

-- Enable RLS
alter table public.calendar_schedules enable row level security;

-- Policies
create policy "Teachers can manage their own calendar schedules"
  on public.calendar_schedules
  for all
  to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

create policy "Students can view calendar schedules"
  on public.calendar_schedules
  for select
  to authenticated
  using (true);

