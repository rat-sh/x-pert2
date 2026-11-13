-- X3: persist in-progress student answers through an ownership-checked RPC.

create or replace function public.save_exam_answers(
  p_submission_id uuid,
  p_answers jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid := auth.uid();
  v_submission public.exam_submissions%rowtype;
begin
  if v_student_id is null then
    raise exception 'Unauthorized';
  end if;

  if jsonb_typeof(p_answers) is distinct from 'array' then
    raise exception 'Answers must be an array';
  end if;
  if jsonb_array_length(p_answers) > 500 then
    raise exception 'Too many answers';
  end if;

  select * into v_submission
  from public.exam_submissions
  where id = p_submission_id
    and student_id = v_student_id
  for update;

  if not found then
    raise exception 'Submission not found or unauthorized';
  end if;
  if v_submission.submitted_at is not null then
    raise exception 'Submission already submitted';
  end if;
  if v_submission.server_end_time is null or now() > v_submission.server_end_time then
    raise exception 'Exam time has expired';
  end if;

  insert into public.submission_answers (
    submission_id,
    question_id,
    student_answer,
    is_correct,
    marks_awarded
  )
  select
    p_submission_id,
    answer.question_id,
    answer.student_answer,
    null,
    0
  from jsonb_to_recordset(p_answers) as answer(question_id uuid, student_answer text)
  join public.questions q
    on q.id = answer.question_id
   and q.exam_id = v_submission.exam_id
  on conflict (submission_id, question_id)
  do update set
    student_answer = excluded.student_answer,
    is_correct = null,
    marks_awarded = 0;
end;
$$;

revoke execute on function public.save_exam_answers(uuid, jsonb) from public, anon;
grant execute on function public.save_exam_answers(uuid, jsonb) to authenticated;
