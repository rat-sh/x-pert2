begin;
select plan(6);
set local role postgres;

insert into auth.users (id, aud, role, email, encrypted_password, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000801', 'authenticated', 'authenticated', 'x8-teacher@example.test', '', '{"role":"teacher"}'::jsonb),
  ('00000000-0000-0000-0000-000000000802', 'authenticated', 'authenticated', 'x8-student-1@example.test', '', '{"role":"student"}'::jsonb),
  ('00000000-0000-0000-0000-000000000803', 'authenticated', 'authenticated', 'x8-student-2@example.test', '', '{"role":"student"}'::jsonb),
  ('00000000-0000-0000-0000-000000000804', 'authenticated', 'authenticated', 'x8-student-3@example.test', '', '{"role":"student"}'::jsonb)
on conflict (id) do nothing;

insert into public.batches (id, teacher_id, name, join_code)
values ('00000000-0000-0000-0000-000000000810', '00000000-0000-0000-0000-000000000801', 'X8 batch', 'X8BATCH')
on conflict (id) do nothing;

insert into public.exams (id, batch_id, teacher_id, title, duration_minutes, total_marks, is_published, status)
values
  ('00000000-0000-0000-0000-000000000811', '00000000-0000-0000-0000-000000000810', '00000000-0000-0000-0000-000000000801', 'X8 negative score', 60, 8, true, 'active'),
  ('00000000-0000-0000-0000-000000000812', '00000000-0000-0000-0000-000000000810', '00000000-0000-0000-0000-000000000801', 'X8 zero negative score', 60, 8, true, 'active'),
  ('00000000-0000-0000-0000-000000000813', '00000000-0000-0000-0000-000000000810', '00000000-0000-0000-0000-000000000801', 'X8 blank score', 60, 8, true, 'active')
on conflict (id) do nothing;

insert into public.questions (id, exam_id, question_text, correct_answer, positive_marks, negative_marks, order_index)
values
  ('00000000-0000-0000-0000-000000000821', '00000000-0000-0000-0000-000000000811', 'X8 Q1', 'right', 4, 0, 0),
  ('00000000-0000-0000-0000-000000000822', '00000000-0000-0000-0000-000000000811', 'X8 Q2', 'right', 4, 1, 1),
  ('00000000-0000-0000-0000-000000000823', '00000000-0000-0000-0000-000000000812', 'X8 Q1 zero penalty', 'right', 4, 0, 0),
  ('00000000-0000-0000-0000-000000000824', '00000000-0000-0000-0000-000000000812', 'X8 Q2 zero penalty', 'right', 4, 0, 1),
  ('00000000-0000-0000-0000-000000000825', '00000000-0000-0000-0000-000000000813', 'X8 Q1 blank', 'right', 4, 0, 0),
  ('00000000-0000-0000-0000-000000000826', '00000000-0000-0000-0000-000000000813', 'X8 Q2 blank', 'right', 4, 1, 1)
on conflict (id) do nothing;

insert into public.exam_submissions (id, exam_id, student_id, server_end_time, total_score)
values
  ('00000000-0000-0000-0000-000000000831', '00000000-0000-0000-0000-000000000811', '00000000-0000-0000-0000-000000000802', now() + interval '30 minutes', 0),
  ('00000000-0000-0000-0000-000000000832', '00000000-0000-0000-0000-000000000812', '00000000-0000-0000-0000-000000000803', now() + interval '30 minutes', 0),
  ('00000000-0000-0000-0000-000000000833', '00000000-0000-0000-0000-000000000813', '00000000-0000-0000-0000-000000000804', now() + interval '30 minutes', 0)
on conflict (id) do nothing;

select ok((select negative_marking from public.exams where id = '00000000-0000-0000-0000-000000000811'),
  'authored negative marks enable exam negative marking');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000802', false);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000802","role":"authenticated"}', false);
set local role authenticated;
select is((select total_score from public.submit_exam(
  '00000000-0000-0000-0000-000000000831'::uuid,
  '[{"question_id":"00000000-0000-0000-0000-000000000821","student_answer":"right"},{"question_id":"00000000-0000-0000-0000-000000000822","student_answer":"wrong"}]'::jsonb
)), 3::numeric, 'right answer plus negative mark for wrong answer scores 3');
select is((select batch_name from public.student_result_view where submission_id = '00000000-0000-0000-0000-000000000831'),
  'X8 batch'::text, 'own result includes its batch name');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000803', false);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000803","role":"authenticated"}', false);
select is((select total_score from public.submit_exam(
  '00000000-0000-0000-0000-000000000832'::uuid,
  '[{"question_id":"00000000-0000-0000-0000-000000000823","student_answer":"right"},{"question_id":"00000000-0000-0000-0000-000000000824","student_answer":"wrong"}]'::jsonb
)), 4::numeric, 'a wrong answer with zero negative marks does not reduce score');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000804', false);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000804","role":"authenticated"}', false);
select is((select total_score from public.submit_exam(
  '00000000-0000-0000-0000-000000000833'::uuid,
  '[{"question_id":"00000000-0000-0000-0000-000000000825","student_answer":""},{"question_id":"00000000-0000-0000-0000-000000000826","student_answer":""}]'::jsonb
)), 0::numeric, 'blank answers score zero');

set local role postgres;
select ok(not (select negative_marking from public.exams where id = '00000000-0000-0000-0000-000000000812'),
  'zero authored negative marks leave negative marking disabled');

select * from finish();
rollback;
