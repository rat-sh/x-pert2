-- ====================================================================
-- 09_exam_submissions.sql
-- Snippet ID: ca73b00e-f306-40bd-bc38-92dd285a781d
-- ====================================================================

create table if not exists public.exam_submissions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  server_end_time timestamptz,
  total_score numeric,
  percentage numeric,
  rank_in_batch integer,
  tab_switch_count integer not null default 0,
  created_at timestamptz not null default now(),
  constraint exam_submissions_student_unique unique (exam_id, student_id)
);

create index if not exists idx_submissions_exam_student on public.exam_submissions(exam_id, student_id);
create index if not exists idx_submissions_student_id on public.exam_submissions(student_id);

-- Stored Procedure: Start Exam attempt with server timer boundary
create or replace function public.start_exam(p_exam_id uuid)
returns table (
  submission_id uuid,
  server_end_time timestamptz
)
language plpgsql
security definer
as $$
declare
  v_student_id uuid := auth.uid();
  v_exam record;
  v_sub record;
  v_calculated_end timestamptz;
begin
  if v_student_id is null then
    raise exception 'Unauthorized';
  end if;

  select * into v_exam from public.exams where id = p_exam_id and is_published = true;
  if v_exam.id is null then
    raise exception 'Exam not found or not published';
  end if;

  select * into v_sub
  from public.exam_submissions
  where exam_id = p_exam_id and student_id = v_student_id;

  if v_sub.id is not null then
    return query select v_sub.id, v_sub.server_end_time;
    return;
  end if;

  v_calculated_end := now() + (v_exam.duration_minutes || ' minutes')::interval;

  insert into public.exam_submissions (
    exam_id,
    student_id,
    started_at,
    server_end_time,
    total_score
  ) values (
    p_exam_id,
    v_student_id,
    now(),
    v_calculated_end,
    0
  )
  returning * into v_sub;

  return query select v_sub.id, v_sub.server_end_time;
end;
$$;

-- Enable RLS & Policies
alter table public.exam_submissions enable row level security;

create policy "Teachers view submissions for own exams"
  on public.exam_submissions for select
  using (
    exists (
      select 1 from public.exams
      where exams.id = exam_submissions.exam_id
        and exams.teacher_id = auth.uid()
    )
  );

create policy "Students view and insert own submissions"
  on public.exam_submissions for all
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

