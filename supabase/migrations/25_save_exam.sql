-- X7: save an exam and its question paper atomically under the caller's RLS policies.

create or replace function public.save_exam_paper(p_exam jsonb, p_questions jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_exam_id uuid;
  v_teacher_id uuid;
  v_total_marks numeric;
begin
  if jsonb_typeof(p_exam) is distinct from 'object'
     or jsonb_typeof(p_questions) is distinct from 'array' then
    raise exception 'Invalid exam paper payload';
  end if;

  v_exam_id := nullif(p_exam->>'id', '')::uuid;
  v_teacher_id := auth.uid();
  if v_teacher_id is null or nullif(p_exam->>'teacher_id', '')::uuid is distinct from v_teacher_id then
    raise exception 'Exam owner does not match authenticated user';
  end if;

  if v_exam_id is null then
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
  else
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
    if not found then raise exception 'Exam not found or unauthorized'; end if;
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

create or replace function public.duplicate_exam(p_exam_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_source public.exams%rowtype;
  v_new_id uuid;
begin
  select * into v_source from public.exams where id = p_exam_id and teacher_id = auth.uid();
  if not found then raise exception 'Exam not found or unauthorized'; end if;

  insert into public.exams (
    teacher_id, batch_id, batch_ids, title, subject, exam_type, board_tag, duration_minutes,
    total_marks, negative_marking, negative_marks_per_wrong, scheduled_at, allow_pyq,
    no_reverse_back, per_question_time_seconds, is_published, status, is_instant
  ) values (
    v_source.teacher_id, v_source.batch_id, v_source.batch_ids, v_source.title || ' (Copy)',
    v_source.subject, v_source.exam_type, v_source.board_tag, v_source.duration_minutes,
    0, false, 0, v_source.scheduled_at, v_source.allow_pyq, v_source.no_reverse_back,
    v_source.per_question_time_seconds, false, 'draft', false
  ) returning id into v_new_id;

  insert into public.questions (
    exam_id, question_text, question_type, options, correct_answer, marks, positive_marks,
    negative_marks, option_images, question_image, chapter_tag, difficulty, order_index,
    is_pyq, section_title
  )
  select v_new_id, q.question_text, q.question_type, q.options, q.correct_answer, q.marks,
    q.positive_marks, q.negative_marks, q.option_images, q.question_image, q.chapter_tag,
    q.difficulty, q.order_index, q.is_pyq, q.section_title
  from public.questions q where q.exam_id = p_exam_id order by q.order_index;

  update public.exams set total_marks = coalesce((select sum(q.positive_marks) from public.questions q where q.exam_id = v_new_id), 0)
  where id = v_new_id;
  return v_new_id;
end;
$$;

revoke all on function public.save_exam_paper(jsonb, jsonb) from public, anon;
revoke all on function public.duplicate_exam(uuid) from public, anon;
grant execute on function public.save_exam_paper(jsonb, jsonb) to authenticated;
grant execute on function public.duplicate_exam(uuid) to authenticated;
