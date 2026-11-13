begin;

select plan(9);
set local role postgres;

insert into auth.users (id, aud, role, email, encrypted_password, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000301', 'authenticated', 'authenticated', 'x3-teacher@example.test', '', '{"role":"teacher","full_name":"X3 Teacher"}'::jsonb),
  ('00000000-0000-0000-0000-000000000302', 'authenticated', 'authenticated', 'x3-student@example.test', '', '{"role":"student","full_name":"X3 Student"}'::jsonb),
  ('00000000-0000-0000-0000-000000000303', 'authenticated', 'authenticated', 'x3-outsider@example.test', '', '{"role":"student","full_name":"X3 Outsider"}'::jsonb)
on conflict (id) do nothing;

insert into public.batches (id, teacher_id, name, join_code)
values ('00000000-0000-0000-0000-000000000310', '00000000-0000-0000-0000-000000000301', 'X3 batch', 'X3CODE')
on conflict (id) do nothing;
insert into public.batch_enrollments (id, batch_id, student_id, is_active)
values ('00000000-0000-0000-0000-000000000320', '00000000-0000-0000-0000-000000000310', '00000000-0000-0000-0000-000000000302', true)
on conflict (id) do nothing;

insert into public.exams (id, batch_id, teacher_id, title, duration_minutes, total_marks, is_published, status)
values
  ('00000000-0000-0000-0000-000000000330', '00000000-0000-0000-0000-000000000310', '00000000-0000-0000-0000-000000000301', 'X3 own exam', 30, 1, true, 'active'),
  ('00000000-0000-0000-0000-000000000331', '00000000-0000-0000-0000-000000000310', '00000000-0000-0000-0000-000000000301', 'X3 foreign exam', 30, 1, true, 'active'),
  ('00000000-0000-0000-0000-000000000332', '00000000-0000-0000-0000-000000000310', '00000000-0000-0000-0000-000000000301', 'X3 submitted exam', 30, 1, true, 'active'),
  ('00000000-0000-0000-0000-000000000333', '00000000-0000-0000-0000-000000000310', '00000000-0000-0000-0000-000000000301', 'X3 expired exam', 30, 1, true, 'active')
on conflict (id) do nothing;
insert into public.questions (id, exam_id, question_text, correct_answer, positive_marks)
values
  ('00000000-0000-0000-0000-000000000340', '00000000-0000-0000-0000-000000000330', 'X3 own question', 'A', 1),
  ('00000000-0000-0000-0000-000000000341', '00000000-0000-0000-0000-000000000331', 'X3 foreign question', 'B', 1)
on conflict (id) do nothing;
insert into public.exam_submissions (id, exam_id, student_id, server_end_time, total_score, submitted_at)
values
  ('00000000-0000-0000-0000-000000000350', '00000000-0000-0000-0000-000000000330', '00000000-0000-0000-0000-000000000302', now() + interval '30 minutes', 0, null),
  ('00000000-0000-0000-0000-000000000351', '00000000-0000-0000-0000-000000000330', '00000000-0000-0000-0000-000000000303', now() + interval '30 minutes', 0, null),
  ('00000000-0000-0000-0000-000000000352', '00000000-0000-0000-0000-000000000332', '00000000-0000-0000-0000-000000000302', now() + interval '30 minutes', 0, now()),
  ('00000000-0000-0000-0000-000000000353', '00000000-0000-0000-0000-000000000333', '00000000-0000-0000-0000-000000000302', now() - interval '1 second', 0, null)
on conflict (id) do nothing;
insert into public.submission_answers (submission_id, question_id, student_answer, is_correct, marks_awarded)
values ('00000000-0000-0000-0000-000000000350', '00000000-0000-0000-0000-000000000340', 'old', true, 1)
on conflict (submission_id, question_id) do nothing;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000302', false);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000302","role":"authenticated"}', false);
set local role authenticated;

select lives_ok(
  $$select public.save_exam_answers('00000000-0000-0000-0000-000000000350'::uuid, '[{"question_id":"00000000-0000-0000-0000-000000000340","student_answer":"A"}]'::jsonb)$$,
  'student can save own in-progress answer'
);
select is(
  (select student_answer from public.submission_answers where submission_id = '00000000-0000-0000-0000-000000000350'::uuid and question_id = '00000000-0000-0000-0000-000000000340'::uuid),
  'A'::text,
  'saved answer is updated and remains readable to its owner'
);
select is(
  (select count(*)::integer from public.submission_answers where submission_id = '00000000-0000-0000-0000-000000000350'::uuid and question_id = '00000000-0000-0000-0000-000000000340'::uuid and is_correct is null and marks_awarded = 0),
  1,
  'autosave clears stale grading state'
);
select is(
  (select count(*)::integer from public.submission_answers where submission_id = '00000000-0000-0000-0000-000000000350'::uuid and question_id = '00000000-0000-0000-0000-000000000341'::uuid),
  0,
  'question from another exam is ignored'
);
select throws_ok(
  $$select public.save_exam_answers('00000000-0000-0000-0000-000000000351'::uuid, '[]'::jsonb)$$,
  'P0001'::char(5), 'Submission not found or unauthorized'::text,
  'student cannot save another student submission'
);
select throws_ok(
  $$select public.save_exam_answers('00000000-0000-0000-0000-000000000352'::uuid, '[]'::jsonb)$$,
  'P0001'::char(5), 'Submission already submitted'::text,
  'submitted attempt cannot be modified'
);
select throws_ok(
  $$select public.save_exam_answers('00000000-0000-0000-0000-000000000353'::uuid, '[]'::jsonb)$$,
  'P0001'::char(5), 'Exam time has expired'::text,
  'expired attempt cannot be modified'
);
select throws_ok(
  $$select public.save_exam_answers('00000000-0000-0000-0000-000000000350'::uuid, '{}'::jsonb)$$,
  'P0001'::char(5), 'Answers must be an array'::text,
  'malformed answer payload is rejected'
);

set local role anon;
select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '{"role":"anon"}', false);
select throws_ok(
  $$select public.save_exam_answers('00000000-0000-0000-0000-000000000350'::uuid, '[]'::jsonb)$$,
  '42501'::char(5), null::text,
  'anon cannot execute save RPC'
);

select * from finish();
rollback;
