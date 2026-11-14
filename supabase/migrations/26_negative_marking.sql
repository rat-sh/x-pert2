-- X8: derive negative-marking enablement from the authored question paper and
-- prevent edits to a paper after a student has attempted its exam.

create or replace function public.sync_exam_negative_marking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exam_id uuid;
begin
  if tg_op = 'UPDATE' and old.exam_id is distinct from new.exam_id then
    update public.exams e
    set negative_marking = exists (
      select 1 from public.questions q
      where q.exam_id = old.exam_id and q.negative_marks > 0
    )
    where e.id = old.exam_id;
  end if;

  v_exam_id := case when tg_op = 'DELETE' then old.exam_id else new.exam_id end;
  update public.exams e
  set negative_marking = exists (
    select 1 from public.questions q
    where q.exam_id = v_exam_id and q.negative_marks > 0
  )
  where e.id = v_exam_id;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists sync_exam_negative_marking on public.questions;
create trigger sync_exam_negative_marking
  after insert or update or delete on public.questions
  for each row execute function public.sync_exam_negative_marking();

update public.exams e
set negative_marking = exists (
  select 1 from public.questions q
  where q.exam_id = e.id and q.negative_marks > 0
);

create or replace function public.prevent_question_edit_after_attempt()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exam_id uuid := case when tg_op = 'DELETE' then old.exam_id else new.exam_id end;
begin
  -- An exam deletion cascades to questions after the parent row is gone.
  if not exists (select 1 from public.exams e where e.id = v_exam_id) then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if exists (
    select 1 from public.exam_submissions s where s.exam_id = v_exam_id
  ) then
    raise exception 'Exam already attempted. Duplicate it to change questions.';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists prevent_question_edit_after_attempt on public.questions;
create trigger prevent_question_edit_after_attempt
  before update or delete on public.questions
  for each row execute function public.prevent_question_edit_after_attempt();

create or replace function public.save_exam_paper(p_exam jsonb, p_questions jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_exam_id uuid;
  v_teacher_id uuid := auth.uid();
  v_total_marks numeric;
begin
  if jsonb_typeof(p_exam) is distinct from 'object'
     or jsonb_typeof(p_questions) is distinct from 'array' then
    raise exception 'Invalid exam paper payload';
  end if;
  if v_teacher_id is null or nullif(p_exam->>'teacher_id', '')::uuid is distinct from v_teacher_id then
    raise exception 'Exam owner does not match authenticated user';
  end if;

  v_exam_id := nullif(p_exam->>'id', '')::uuid;
  if v_exam_id is not null then
    if not exists (
      select 1 from public.exams e where e.id = v_exam_id and e.teacher_id = v_teacher_id
    ) then
      raise exception 'Exam not found or unauthorized';
    end if;
    if exists (select 1 from public.exam_submissions s where s.exam_id = v_exam_id) then
      raise exception 'Exam already attempted. Duplicate it to change questions.';
    end if;

    update public.exams set
      batch_id = nullif(p_exam->>'batch_id', '')::uuid,
      batch_ids = coalesce(array(select jsonb_array_elements_text(coalesce(p_exam->'batch_ids', '[]'::jsonb))::uuid), '{}'::uuid[]),
      title = p_exam->>'title', subject = p_exam->>'subject',
      duration_minutes = (p_exam->>'duration_minutes')::integer,
      scheduled_at = nullif(p_exam->>'scheduled_at', '')::timestamptz,
      is_instant = coalesce((p_exam->>'is_instant')::boolean, false),
      instant_expires_at = nullif(p_exam->>'instant_expires_at', '')::timestamptz,
      allow_pyq = coalesce((p_exam->>'allow_pyq')::boolean, false),
      no_reverse_back = coalesce((p_exam->>'no_reverse_back')::boolean, false),
      per_question_time_seconds = nullif(p_exam->>'per_question_time_seconds', '')::integer,
      exam_type = coalesce(p_exam->>'exam_type', 'test'), board_tag = p_exam->>'board_tag'
    where id = v_exam_id and teacher_id = v_teacher_id;
  else
    insert into public.exams (
      teacher_id, batch_id, batch_ids, title, subject, duration_minutes, total_marks,
      scheduled_at, is_instant, instant_expires_at, allow_pyq, no_reverse_back,
      per_question_time_seconds, negative_marking, negative_marks_per_wrong,
      is_published, status, exam_type, board_tag
    ) values (
      v_teacher_id, nullif(p_exam->>'batch_id', '')::uuid,
      coalesce(array(select jsonb_array_elements_text(coalesce(p_exam->'batch_ids', '[]'::jsonb))::uuid), '{}'::uuid[]),
      p_exam->>'title', p_exam->>'subject', (p_exam->>'duration_minutes')::integer, 0,
      nullif(p_exam->>'scheduled_at', '')::timestamptz, coalesce((p_exam->>'is_instant')::boolean, false),
      nullif(p_exam->>'instant_expires_at', '')::timestamptz, coalesce((p_exam->>'allow_pyq')::boolean, false),
      coalesce((p_exam->>'no_reverse_back')::boolean, false),
      nullif(p_exam->>'per_question_time_seconds', '')::integer, false, 0,
      coalesce((p_exam->>'is_published')::boolean, false), coalesce(p_exam->>'status', 'draft'),
      coalesce(p_exam->>'exam_type', 'test'), p_exam->>'board_tag'
    ) returning id into v_exam_id;
  end if;

  if jsonb_array_length(p_questions) = 0 then raise exception 'Add at least one question'; end if;

  with question_rows as (
    select * from jsonb_to_recordset(p_questions) as q(
      id uuid, question_text text, question_image text, question_type text,
      options jsonb, option_images jsonb, correct_answer text, marks numeric,
      positive_marks numeric, negative_marks numeric, difficulty text,
      is_pyq boolean, section_title text, order_index integer
    )
  )
  delete from public.questions old_q
  where old_q.exam_id = v_exam_id
    and not exists (select 1 from question_rows incoming where incoming.id = old_q.id);

  insert into public.questions (
    id, exam_id, question_text, question_image, question_type, options, option_images,
    correct_answer, marks, positive_marks, negative_marks, chapter_tag, difficulty,
    is_pyq, section_title, order_index
  )
  select coalesce(q.id, gen_random_uuid()), v_exam_id, q.question_text, q.question_image,
    q.question_type, q.options, q.option_images, q.correct_answer,
    coalesce(q.marks, q.positive_marks, 1), coalesce(q.positive_marks, q.marks, 1),
    coalesce(q.negative_marks, 0), null, coalesce(q.difficulty, 'medium'),
    coalesce(q.is_pyq, false), q.section_title, coalesce(q.order_index, 0)
  from jsonb_to_recordset(p_questions) as q(
    id uuid, question_text text, question_image text, question_type text,
    options jsonb, option_images jsonb, correct_answer text, marks numeric,
    positive_marks numeric, negative_marks numeric, difficulty text,
    is_pyq boolean, section_title text, order_index integer
  )
  on conflict (id) do update set
    question_text = excluded.question_text, question_image = excluded.question_image,
    question_type = excluded.question_type, options = excluded.options,
    option_images = excluded.option_images, correct_answer = excluded.correct_answer,
    marks = excluded.marks, positive_marks = excluded.positive_marks,
    negative_marks = excluded.negative_marks, difficulty = excluded.difficulty,
    is_pyq = excluded.is_pyq, section_title = excluded.section_title,
    order_index = excluded.order_index
  where public.questions.exam_id = excluded.exam_id;

  select coalesce(sum(coalesce(q.positive_marks, q.marks, 0)), 0)
    into v_total_marks from jsonb_to_recordset(p_questions) as q(marks numeric, positive_marks numeric);
  update public.exams set total_marks = v_total_marks where id = v_exam_id and teacher_id = v_teacher_id;
  return v_exam_id;
end;
$$;

revoke all on function public.save_exam_paper(jsonb, jsonb) from public, anon;
grant execute on function public.save_exam_paper(jsonb, jsonb) to authenticated;

create or replace view public.student_result_view as
select
  s.id as submission_id,
  s.exam_id,
  e.title as exam_title,
  s.total_score,
  e.total_marks,
  s.started_at,
  s.submitted_at,
  s.percentage,
  b.name as batch_name
from public.exam_submissions s
join public.exams e on e.id = s.exam_id
left join public.batches b on b.id = e.batch_id
where s.student_id = auth.uid()
  and s.submitted_at is not null;

create or replace view public.student_answer_review_view as
select
  s.id as submission_id,
  q.id as question_id,
  q.question_text,
  q.question_type,
  q.correct_answer,
  sa.student_answer,
  coalesce(sa.is_correct, false) as is_correct,
  coalesce(sa.marks_awarded, 0) as marks_awarded,
  q.positive_marks as max_marks
from public.exam_submissions s
join public.questions q on q.exam_id = s.exam_id
left join public.submission_answers sa
  on sa.submission_id = s.id and sa.question_id = q.id
where s.student_id = auth.uid()
  and s.submitted_at is not null;

revoke all on public.student_result_view from anon;
revoke all on public.student_answer_review_view from anon;
grant select on public.student_result_view to authenticated;
grant select on public.student_answer_review_view to authenticated;

-- The client only needs profile fields used to render the signed-in account.
drop function public.get_my_user_profile();
create function public.get_my_user_profile()
returns table (
  id uuid,
  full_name text,
  role text,
  email text,
  phone text,
  preferred_language text,
  date_of_birth date,
  pin_set_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.full_name, u.role, u.email, u.phone, u.preferred_language,
         u.date_of_birth, u.pin_set_at, u.created_at
  from public.users u
  where u.id = auth.uid();
$$;
revoke execute on function public.get_my_user_profile() from public, anon;
grant execute on function public.get_my_user_profile() to authenticated;
