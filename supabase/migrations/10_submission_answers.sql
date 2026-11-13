-- ====================================================================
-- 10_submission_answers.sql
-- Snippet ID: 866d2c13-4726-4c80-8aca-b220bedad578
-- ====================================================================

create table if not exists public.submission_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.exam_submissions(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  student_answer text,
  is_correct boolean,
  marks_awarded numeric not null default 0,
  constraint submission_answers_unique_question unique (submission_id, question_id)
);

create index if not exists idx_submission_answers_sub on public.submission_answers(submission_id);

-- Stored Procedure: Submit and auto-grade exam attempt
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
as $$
declare
  v_student_id uuid := auth.uid();
  v_sub record;
  v_exam record;
  v_answer record;
  v_question record;
  v_score numeric := 0;
  v_is_correct boolean;
  v_marks_awarded numeric;
  v_pct numeric := 0;
begin
  select * into v_sub from public.exam_submissions where id = p_submission_id and student_id = v_student_id;
  if v_sub.id is null then
    raise exception 'Submission not found or unauthorized';
  end if;

  select * into v_exam from public.exams where id = v_sub.exam_id;

  for v_answer in select * from jsonb_to_recordset(p_answers) as x(question_id uuid, student_answer text)
  loop
    select * into v_question from public.questions where id = v_answer.question_id;
    if v_question.id is not null then
      v_is_correct := (trim(lower(coalesce(v_answer.student_answer, ''))) = trim(lower(coalesce(v_question.correct_answer, ''))));
      if v_is_correct then
        v_marks_awarded := v_question.positive_marks;
      else
        v_marks_awarded := -1 * abs(v_question.negative_marks);
      end if;

      v_score := v_score + v_marks_awarded;

      insert into public.submission_answers (
        submission_id,
        question_id,
        student_answer,
        is_correct,
        marks_awarded
      ) values (
        p_submission_id,
        v_answer.question_id,
        v_answer.student_answer,
        v_is_correct,
        v_marks_awarded
      )
      on conflict (submission_id, question_id)
      do update set
        student_answer = excluded.student_answer,
        is_correct = excluded.is_correct,
        marks_awarded = excluded.marks_awarded;
    end if;
  end loop;

  if v_exam.total_marks > 0 then
    v_pct := round((greatest(0, v_score) / v_exam.total_marks) * 100, 2);
  end if;

  update public.exam_submissions
  set
    total_score = greatest(0, v_score),
    percentage = v_pct,
    submitted_at = now()
  where id = p_submission_id;

  return query select greatest(0, v_score), v_pct;
end;
$$;

-- Enable RLS & Policies
alter table public.submission_answers enable row level security;

create policy "Teachers view answers for own exams"
  on public.submission_answers for select
  using (
    exists (
      select 1 from public.exam_submissions s
      join public.exams e on e.id = s.exam_id
      where s.id = submission_answers.submission_id
        and e.teacher_id = auth.uid()
    )
  );

create policy "Students view own answers"
  on public.submission_answers for select
  using (
    exists (
      select 1 from public.exam_submissions s
      where s.id = submission_answers.submission_id
        and s.student_id = auth.uid()
    )
  );

