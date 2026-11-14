-- X2: expose only student-safe exam, question, result, and review data.

drop policy if exists "Students view published exams for enrolled batches" on public.exams;
drop policy if exists "Students view questions via exam enrollment" on public.questions;

create or replace view public.student_exams_view as
select
  e.id,
  e.batch_id,
  e.batch_ids,
  e.teacher_id,
  e.title,
  e.subject,
  e.exam_type,
  e.board_tag,
  e.duration_minutes,
  e.total_marks,
  e.negative_marking,
  e.negative_marks_per_wrong,
  e.is_published,
  e.status,
  e.allow_pyq,
  e.no_reverse_back,
  e.per_question_time_seconds,
  e.is_instant,
  e.instant_expires_at,
  e.scheduled_at,
  e.created_at
from public.exams e
where e.is_published
  and auth.uid() is not null
  and exists (
    select 1
    from public.batch_enrollments be
    where be.student_id = auth.uid()
      and be.is_active
      and (
        be.batch_id = e.batch_id
        or be.batch_id = any(coalesce(e.batch_ids, '{}'::uuid[]))
      )
  );

create or replace view public.student_questions_view as
select
  q.id,
  q.exam_id,
  q.question_text,
  q.question_type,
  q.options,
  q.marks,
  q.positive_marks,
  q.negative_marks,
  q.option_images,
  q.question_image,
  q.chapter_tag,
  q.difficulty,
  q.order_index,
  q.is_pyq,
  q.section_title
from public.questions q
where exists (
  select 1
  from public.exam_submissions s
  where s.exam_id = q.exam_id
    and s.student_id = auth.uid()
    and s.submitted_at is null
    and now() < s.server_end_time
);

drop view if exists public.active_exam_questions;

create or replace view public.student_result_view as
select
  s.id as submission_id,
  s.exam_id,
  e.title as exam_title,
  s.total_score,
  e.total_marks,
  s.started_at,
  s.submitted_at,
  s.percentage
from public.exam_submissions s
join public.exams e on e.id = s.exam_id
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
  sa.is_correct,
  sa.marks_awarded,
  q.positive_marks as max_marks
from public.exam_submissions s
join public.submission_answers sa on sa.submission_id = s.id
join public.questions q on q.id = sa.question_id and q.exam_id = s.exam_id
where s.student_id = auth.uid()
  and s.submitted_at is not null;

revoke all on public.student_exams_view from anon;
revoke all on public.student_questions_view from anon;
revoke all on public.student_result_view from anon;
revoke all on public.student_answer_review_view from anon;
grant select on public.student_exams_view to authenticated;
grant select on public.student_questions_view to authenticated;
grant select on public.student_result_view to authenticated;
grant select on public.student_answer_review_view to authenticated;
