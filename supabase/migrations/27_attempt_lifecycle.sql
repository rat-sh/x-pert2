-- Server-authoritative exam windows and expiration grading.

alter table public.exams add column if not exists ends_at timestamptz;

create or replace function public.server_time()
returns timestamptz
language sql
stable
security invoker
as $$ select now(); $$;
revoke all on function public.server_time() from public, anon;
grant execute on function public.server_time() to authenticated;

create or replace view public.student_exams_view as
select
  e.id, e.batch_id, e.batch_ids, e.teacher_id, e.title, e.subject, e.exam_type,
  e.board_tag, e.duration_minutes, e.total_marks, e.negative_marking,
  e.negative_marks_per_wrong, e.is_published, e.status, e.allow_pyq,
  e.no_reverse_back, e.per_question_time_seconds, e.is_instant,
  e.instant_expires_at, e.scheduled_at, e.created_at, e.ends_at,
  b.name as batch_name
from public.exams e
left join public.batches b on b.id = coalesce(e.batch_id, e.batch_ids[1])
where e.is_published
  and auth.uid() is not null
  and exists (
    select 1 from public.batch_enrollments be
    where be.student_id = auth.uid() and be.is_active
      and (be.batch_id = e.batch_id or be.batch_id = any(coalesce(e.batch_ids, '{}'::uuid[])))
  );
revoke all on public.student_exams_view from anon;
grant select on public.student_exams_view to authenticated;

create or replace function public.start_exam(p_exam_id uuid)
returns table (submission_id uuid, server_end_time timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid := auth.uid();
  v_exam public.exams%rowtype;
  v_sub public.exam_submissions%rowtype;
  v_calculated_end timestamptz;
begin
  if v_student_id is null or public.current_user_role() is distinct from 'student' then
    raise exception 'Students only';
  end if;

  select * into v_sub from public.exam_submissions
  where exam_id = p_exam_id and student_id = v_student_id;
  if v_sub.id is not null then
    return query select v_sub.id, v_sub.server_end_time;
    return;
  end if;

  select * into v_exam from public.exams
  where id = p_exam_id and is_published = true
    and status in ('scheduled', 'active')
    and (scheduled_at is null or scheduled_at <= now())
    and (instant_expires_at is null or instant_expires_at > now())
    and (ends_at is null or now() <= ends_at);
  if v_exam.id is null then raise exception 'Exam not found or not available'; end if;

  if not exists (
    select 1 from public.batch_enrollments be
    where be.student_id = v_student_id and be.is_active
      and (be.batch_id = v_exam.batch_id or (v_exam.batch_ids is not null and be.batch_id = any(v_exam.batch_ids)))
  ) then raise exception 'Student is not enrolled in this exam'; end if;

  v_calculated_end := now() + (v_exam.duration_minutes || ' minutes')::interval;
  insert into public.exam_submissions (exam_id, student_id, started_at, server_end_time, total_score)
  values (p_exam_id, v_student_id, now(), v_calculated_end, 0)
  on conflict (exam_id, student_id) do nothing returning * into v_sub;
  if v_sub.id is null then
    select * into v_sub from public.exam_submissions
    where exam_id = p_exam_id and student_id = v_student_id;
  end if;
  return query select v_sub.id, v_sub.server_end_time;
end;
$$;

create or replace function public.grade_submission(p_submission_id uuid)
returns table (total_score numeric, percentage numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.exam_submissions%rowtype;
  v_exam public.exams%rowtype;
  v_score numeric := 0;
  v_pct numeric := 0;
begin
  select * into v_sub from public.exam_submissions where id = p_submission_id for update;
  if v_sub.id is null then raise exception 'Submission not found'; end if;
  if v_sub.submitted_at is not null then
    return query select v_sub.total_score, v_sub.percentage;
    return;
  end if;
  select * into v_exam from public.exams where id = v_sub.exam_id;

  update public.submission_answers sa
  set is_correct = case
        when nullif(trim(coalesce(sa.student_answer, '')), '') is null then false
        else lower(trim(sa.student_answer)) = lower(trim(coalesce(q.correct_answer, '')))
      end,
      marks_awarded = case
        when nullif(trim(coalesce(sa.student_answer, '')), '') is null then 0
        when lower(trim(sa.student_answer)) = lower(trim(coalesce(q.correct_answer, ''))) then coalesce(q.positive_marks, 0)
        when v_exam.negative_marking then -abs(coalesce(q.negative_marks, 0))
        else 0
      end
  from public.questions q
  where sa.submission_id = p_submission_id and q.id = sa.question_id and q.exam_id = v_sub.exam_id;

  select coalesce(sum(marks_awarded), 0) into v_score
  from public.submission_answers where submission_id = p_submission_id;
  if v_exam.total_marks > 0 then v_pct := round((greatest(0, v_score) / v_exam.total_marks) * 100, 2); end if;
  update public.exam_submissions
  set total_score = greatest(0, v_score), percentage = v_pct, submitted_at = now()
  where id = p_submission_id;
  return query select greatest(0, v_score), v_pct;
end;
$$;

create or replace function public.submit_exam(p_submission_id uuid, p_answers jsonb)
returns table (total_score numeric, percentage numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid := auth.uid();
  v_sub public.exam_submissions%rowtype;
begin
  select * into v_sub from public.exam_submissions
  where id = p_submission_id and student_id = v_student_id for update;
  if v_sub.id is null then raise exception 'Submission not found or unauthorized'; end if;
  if v_sub.submitted_at is not null then return query select v_sub.total_score, v_sub.percentage; return; end if;
  if jsonb_typeof(p_answers) is distinct from 'array' then raise exception 'Invalid answers'; end if;
  if jsonb_array_length(p_answers) > 500 then raise exception 'Too many answers'; end if;

  if now() <= v_sub.server_end_time + interval '30 seconds' then
    insert into public.submission_answers (submission_id, question_id, student_answer)
    select p_submission_id, parsed.question_id, parsed.student_answer
    from (
      select distinct on (answer.value->>'question_id')
        (answer.value->>'question_id')::uuid as question_id,
        answer.value->>'student_answer' as student_answer
      from jsonb_array_elements(p_answers) with ordinality as answer(value, ordinality)
      where answer.value ? 'question_id'
      order by answer.value->>'question_id', answer.ordinality desc
    ) parsed
    join public.questions q on q.id = parsed.question_id and q.exam_id = v_sub.exam_id
    on conflict (submission_id, question_id) do update set student_answer = excluded.student_answer;
  end if;

  if now() > v_sub.server_end_time + interval '30 seconds' then
    update public.exam_submissions set is_late = true where id = p_submission_id;
  end if;
  return query select * from public.grade_submission(p_submission_id);
end;
$$;

create or replace function public.finalize_expired_submissions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_count integer;
begin
  with expired as (
    select id from public.exam_submissions
    where submitted_at is null and now() > server_end_time + interval '30 seconds'
    for update skip locked
  ), graded as (
    update public.exam_submissions s set is_late = true
    from expired e where s.id = e.id returning s.id
  )
  select count(*) into v_count from graded;
  perform public.grade_submission(id) from public.exam_submissions
  where submitted_at is null and is_late and now() > server_end_time + interval '30 seconds';
  return v_count;
end;
$$;
revoke all on function public.grade_submission(uuid) from public, anon, authenticated;
revoke all on function public.finalize_expired_submissions() from public, anon, authenticated;
revoke all on function public.submit_exam(uuid, jsonb) from public, anon;
grant execute on function public.submit_exam(uuid, jsonb) to authenticated;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('finalize-expired-submissions', '* * * * *', 'select public.finalize_expired_submissions();');
  end if;
exception when unique_violation then null;
end;
$$;
