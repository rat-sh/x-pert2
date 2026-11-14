begin;

select plan(9);
set local role postgres;

insert into auth.users (id, aud, role, email, encrypted_password, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000101', 'authenticated', 'authenticated', 'x2-teacher@example.test', '', '{"role":"teacher","full_name":"X2 Teacher"}'::jsonb),
  ('00000000-0000-0000-0000-000000000102', 'authenticated', 'authenticated', 'x2-student@example.test', '', '{"role":"student","full_name":"X2 Student"}'::jsonb)
on conflict (id) do nothing;
insert into public.users (id, full_name, role, email)
values
  ('00000000-0000-0000-0000-000000000101', 'X2 Teacher', 'teacher', 'x2-teacher@example.test'),
  ('00000000-0000-0000-0000-000000000102', 'X2 Student', 'student', 'x2-student@example.test')
on conflict (id) do nothing;
insert into public.batches (id, teacher_id, name, join_code)
values ('00000000-0000-0000-0000-000000000110', '00000000-0000-0000-0000-000000000101', 'X2 batch', 'X2BATCH')
on conflict (id) do nothing;
insert into public.batch_enrollments (id, batch_id, student_id, is_active)
values ('00000000-0000-0000-0000-000000000120', '00000000-0000-0000-0000-000000000110', '00000000-0000-0000-0000-000000000102', true)
on conflict (id) do nothing;
insert into public.exams (id, batch_id, teacher_id, title, duration_minutes, total_marks, exam_key, exam_pin, is_published, status)
values ('00000000-0000-0000-0000-000000000130', '00000000-0000-0000-0000-000000000110', '00000000-0000-0000-0000-000000000101', 'X2 exam', 30, 1, 'SECRETKEY', '4321', true, 'active')
on conflict (id) do nothing;
insert into public.questions (id, exam_id, question_text, correct_answer, positive_marks)
values
  ('00000000-0000-0000-0000-000000000140', '00000000-0000-0000-0000-000000000130', 'X2 question', 'correct', 1),
  ('00000000-0000-0000-0000-000000000141', '00000000-0000-0000-0000-000000000130', 'X2 unanswered question', 'correct', 1)
on conflict (id) do nothing;
insert into public.exam_submissions (id, exam_id, student_id, server_end_time, total_score)
values ('00000000-0000-0000-0000-000000000150', '00000000-0000-0000-0000-000000000130', '00000000-0000-0000-0000-000000000102', now() + interval '30 minutes', 1)
on conflict (id) do nothing;
insert into public.submission_answers (submission_id, question_id, student_answer, is_correct, marks_awarded)
values ('00000000-0000-0000-0000-000000000150', '00000000-0000-0000-0000-000000000140', 'correct', true, 1)
on conflict (submission_id, question_id) do nothing;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000102', false);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000102","role":"authenticated"}', false);
set local role authenticated;

select is_empty(
  $$select correct_answer from public.questions where id = '00000000-0000-0000-0000-000000000140'::uuid$$,
  'student cannot read question answer through base table'
);
select is_empty(
  $$select exam_pin from public.exams where id = '00000000-0000-0000-0000-000000000130'::uuid$$,
  'student cannot read exam PIN through base table'
);
select is((select count(*)::integer from public.student_exams_view where id = '00000000-0000-0000-0000-000000000130'::uuid), 1,
  'enrolled student can read published exam through safe view');
select ok(not exists (
  select 1 from information_schema.columns
  where table_schema = 'public' and table_name = 'student_exams_view' and column_name in ('exam_key', 'exam_pin')
), 'student exam view has no key or PIN columns');
select is_empty(
  $$select * from public.student_answer_review_view where submission_id = '00000000-0000-0000-0000-000000000150'::uuid$$,
  'answer review is empty before submission'
);
select is_empty(
  $$select * from public.student_result_view where submission_id = '00000000-0000-0000-0000-000000000150'::uuid$$,
  'results include submitted attempts only'
);

set local role postgres;
update public.exam_submissions set submitted_at = now()
where id = '00000000-0000-0000-0000-000000000150'::uuid;
set local role authenticated;
select is((select count(*)::integer from public.student_answer_review_view where submission_id = '00000000-0000-0000-0000-000000000150'::uuid), 2,
  'review reveals answer only after submission');
select ok(exists (
  select 1 from public.student_answer_review_view
  where submission_id = '00000000-0000-0000-0000-000000000150'::uuid
    and question_id = '00000000-0000-0000-0000-000000000141'::uuid
    and student_answer is null and marks_awarded = 0
), 'answer review includes unanswered questions with zero marks');
select is((select count(*)::integer from public.student_result_view where submission_id = '00000000-0000-0000-0000-000000000150'::uuid), 1,
  'student sees own submitted result');

select * from finish();
rollback;
