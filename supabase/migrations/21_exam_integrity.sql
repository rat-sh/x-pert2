-- X1: grade tamper resistance and server-authoritative submission.

alter table public.exam_submissions
  add column if not exists is_late boolean not null default false;

drop policy if exists "Students view and insert own submissions" on public.exam_submissions;
drop policy if exists "Students view own submissions" on public.exam_submissions;
create policy "Students view own submissions"
  on public.exam_submissions for select
  to authenticated
  using (student_id = auth.uid());

revoke insert, update, delete on public.exam_submissions from anon, authenticated;
revoke insert, update, delete on public.submission_answers from anon, authenticated;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.start_exam(p_exam_id uuid)
returns table (
  submission_id uuid,
  server_end_time timestamptz
)
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
  if v_student_id is null or public.current_user_role() <> 'student' then
    raise exception 'Students only';
  end if;

  select * into v_exam
  from public.exams
  where id = p_exam_id
    and is_published = true
    and status in ('scheduled', 'active')
    and (scheduled_at is null or scheduled_at <= now())
    and (instant_expires_at is null or instant_expires_at > now());

  if v_exam.id is null then
    raise exception 'Exam not found or not available';
  end if;

  if not exists (
    select 1
    from public.batch_enrollments be
    where be.student_id = v_student_id
      and be.is_active = true
      and (
        be.batch_id = v_exam.batch_id
        or (v_exam.batch_ids is not null and be.batch_id = any(v_exam.batch_ids))
      )
  ) then
    raise exception 'Student is not enrolled in this exam';
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
    exam_id, student_id, started_at, server_end_time, total_score
  ) values (
    p_exam_id, v_student_id, now(), v_calculated_end, 0
  )
  returning * into v_sub;

  return query select v_sub.id, v_sub.server_end_time;
end;
$$;

create or replace function public.submit_exam(
  p_submission_id uuid,
  p_answers jsonb
)
returns table (
  total_score numeric,
  percentage numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid := auth.uid();
  v_sub public.exam_submissions%rowtype;
  v_exam public.exams%rowtype;
  v_answer record;
  v_saved record;
  v_score numeric := 0;
  v_is_correct boolean;
  v_marks_awarded numeric;
  v_pct numeric := 0;
  v_is_late boolean := false;
begin
  select * into v_sub
  from public.exam_submissions
  where id = p_submission_id and student_id = v_student_id
  for update;

  if v_sub.id is null then
    raise exception 'Submission not found or unauthorized';
  end if;

  if v_sub.submitted_at is not null then
    return query select v_sub.total_score, v_sub.percentage;
    return;
  end if;

  select * into v_exam from public.exams where id = v_sub.exam_id;

  v_is_late := v_sub.server_end_time is not null
    and now() > v_sub.server_end_time + interval '30 seconds';

  if v_is_late then
    -- After the grace window, only answers already persisted by autosave count.
    for v_saved in
      select sa.*, q.positive_marks, q.negative_marks, q.correct_answer
      from public.submission_answers sa
      join public.questions q
        on q.id = sa.question_id
       and q.exam_id = v_sub.exam_id
      where sa.submission_id = p_submission_id
    loop
      if nullif(trim(coalesce(v_saved.student_answer, '')), '') is null then
        v_is_correct := false;
        v_marks_awarded := 0;
      else
        v_is_correct := trim(lower(v_saved.student_answer)) = trim(lower(coalesce(v_saved.correct_answer, '')));
        v_marks_awarded := case
          when v_is_correct then coalesce(v_saved.positive_marks, 0)
          when v_exam.negative_marking then -abs(coalesce(v_saved.negative_marks, 0))
          else 0
        end;
      end if;

      v_score := v_score + v_marks_awarded;
      update public.submission_answers
      set is_correct = v_is_correct, marks_awarded = v_marks_awarded
      where id = v_saved.id;
    end loop;
  else
    for v_answer in
      select x.question_id, x.student_answer, q.positive_marks, q.negative_marks, q.correct_answer
      from jsonb_to_recordset(coalesce(p_answers, '[]'::jsonb)) as x(question_id uuid, student_answer text)
      join public.questions q
        on q.id = x.question_id
       and q.exam_id = v_sub.exam_id
    loop
      if nullif(trim(coalesce(v_answer.student_answer, '')), '') is null then
        v_is_correct := false;
        v_marks_awarded := 0;
      else
        v_is_correct := trim(lower(v_answer.student_answer)) = trim(lower(coalesce(v_answer.correct_answer, '')));
        v_marks_awarded := case
          when v_is_correct then coalesce(v_answer.positive_marks, 0)
          when v_exam.negative_marking then -abs(coalesce(v_answer.negative_marks, 0))
          else 0
        end;
      end if;

      v_score := v_score + v_marks_awarded;
      insert into public.submission_answers (
        submission_id, question_id, student_answer, is_correct, marks_awarded
      ) values (
        p_submission_id, v_answer.question_id, v_answer.student_answer, v_is_correct, v_marks_awarded
      )
      on conflict (submission_id, question_id)
      do update set
        student_answer = excluded.student_answer,
        is_correct = excluded.is_correct,
        marks_awarded = excluded.marks_awarded;
    end loop;
  end if;

  if v_exam.total_marks > 0 then
    v_pct := round((greatest(0, v_score) / v_exam.total_marks) * 100, 2);
  end if;

  update public.exam_submissions
  set total_score = greatest(0, v_score),
      percentage = v_pct,
      submitted_at = now(),
      is_late = v_is_late
  where id = p_submission_id;

  return query select greatest(0, v_score), v_pct;
end;
$$;

create or replace function public.join_batch_by_code(p_join_code text)
returns table (
  out_batch_id uuid,
  out_batch_name text,
  out_teacher_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid := auth.uid();
  v_batch record;
  v_teacher_name text;
begin
  if v_student_id is null then
    raise exception 'Unauthorized';
  end if;

  select b.id, b.name, b.teacher_id, b.is_active
  into v_batch
  from public.batches b
  where upper(trim(b.join_code)) = upper(trim(p_join_code))
  limit 1;

  if v_batch.id is null then
    raise exception 'Invalid join code. Please check and try again.';
  end if;
  if not v_batch.is_active then
    raise exception 'This batch is currently inactive.';
  end if;

  insert into public.batch_enrollments (batch_id, student_id, is_active)
  values (v_batch.id, v_student_id, true)
  on conflict (batch_id, student_id) do update set is_active = true;

  select u.full_name into v_teacher_name
  from public.users u where u.id = v_batch.teacher_id;

  return query select v_batch.id, v_batch.name, coalesce(v_teacher_name, 'Teacher');
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
  v_role text;
  v_phone text;
begin
  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  v_role := coalesce(new.raw_user_meta_data->>'role', 'student');
  v_phone := new.raw_user_meta_data->>'phone';

  insert into public.users (id, full_name, role, email, phone)
  values (new.id, v_full_name, v_role, new.email, v_phone)
  on conflict (id) do update
  set full_name = excluded.full_name,
      email = excluded.email,
      phone = coalesce(excluded.phone, public.users.phone);

  return new;
end;
$$;

revoke execute on function public.start_exam(uuid) from anon;
grant execute on function public.start_exam(uuid) to authenticated;
revoke execute on function public.submit_exam(uuid, jsonb) from anon;
grant execute on function public.submit_exam(uuid, jsonb) to authenticated;
revoke execute on function public.join_batch_by_code(text) from anon;
grant execute on function public.join_batch_by_code(text) to authenticated;
