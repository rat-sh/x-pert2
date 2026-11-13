begin;

select plan(6);

set local role postgres;

insert into auth.users (id, aud, role, email, encrypted_password, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'x1-teacher@example.test', '', '{"role":"teacher","full_name":"X1 Teacher"}'::jsonb),
  ('00000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'x1-student@example.test', '', '{"role":"student","full_name":"X1 Student"}'::jsonb)
on conflict (id) do nothing;

insert into public.batches (id, teacher_id, name, join_code)
values
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'X1 enrolled', 'X1ENR'),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'X1 other', 'X1OTH')
on conflict (id) do nothing;

insert into public.batch_enrollments (id, batch_id, student_id)
values ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002')
on conflict (id) do nothing;

insert into public.exams (id, batch_id, teacher_id, title, duration_minutes, total_marks, is_published, status)
values
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'X1 normal', 60, 1, true, 'active'),
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'X1 late', 60, 1, true, 'active'),
  ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'X1 unenrolled', 60, 1, true, 'active')
on conflict (id) do nothing;

insert into public.questions (id, exam_id, question_text, correct_answer, positive_marks)
values
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000030', 'X1 normal question', 'A', 1),
  ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000031', 'X1 foreign question', 'B', 1)
on conflict (id) do nothing;

insert into public.exam_submissions (id, exam_id, student_id, server_end_time, total_score)
values
  ('00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000002', now() + interval '10 minutes', 0),
  ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000002', now() - interval '1 minute', 0)
on conflict (id) do nothing;

insert into public.submission_answers (submission_id, question_id, student_answer)
values ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000041', 'B')
on conflict (submission_id, question_id) do update set student_answer = excluded.student_answer;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
set local role authenticated;

select is(
  (select total_score from public.submit_exam(
    '00000000-0000-0000-0000-000000000050'::uuid,
    '[{"question_id":"00000000-0000-0000-0000-000000000040","student_answer":"A"}]'::jsonb
  )),
  1::numeric,
  'submit_exam grades a matching question'
);

select is(
  (select total_score from public.submit_exam(
    '00000000-0000-0000-0000-000000000050'::uuid,
    '[{"question_id":"00000000-0000-0000-0000-000000000041","student_answer":"B"}]'::jsonb
  )),
  1::numeric,
  'double submit returns the stored score and ignores a foreign exam question'
);

select throws_ok(
  $$update public.exam_submissions set total_score = 999 where id = '00000000-0000-0000-0000-000000000050'::uuid$$,
  '42501',
  null,
  'students cannot update their own submission score'
);

select throws_ok(
  $$delete from public.exam_submissions where id = '00000000-0000-0000-0000-000000000050'::uuid$$,
  '42501',
  null,
  'students cannot delete their own submission'
);

select is(
  (select total_score from public.submit_exam(
    '00000000-0000-0000-0000-000000000051'::uuid,
    '[{"question_id":"00000000-0000-0000-0000-000000000041","student_answer":"wrong"}]'::jsonb
  )),
  1::numeric,
  'late submit ignores payload and grades saved answers without error'
);

select throws_ok(
  $$select public.start_exam('00000000-0000-0000-0000-000000000032'::uuid)$$,
  null,
  null,
  'a non-enrolled student cannot start an exam'
);

select * from finish();
rollback;
