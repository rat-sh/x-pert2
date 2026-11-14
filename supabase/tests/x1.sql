begin;

select plan(14);

set local role postgres;

insert into auth.users (id, aud, role, email, encrypted_password, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'x1-teacher@example.test', '', '{"role":"teacher","full_name":"X1 Teacher"}'::jsonb),
  ('00000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'x1-student@example.test', '', '{"role":"student","full_name":"X1 Student"}'::jsonb),
  ('00000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'x1-no-profile@example.test', '', '{"role":"student","full_name":"X1 No Profile"}'::jsonb)
on conflict (id) do nothing;

-- Exercise the null-role guard: auth identity exists, but its public profile does not.
delete from public.users where id = '00000000-0000-0000-0000-000000000003';

insert into public.batches (id, teacher_id, name, join_code)
values
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'X1 enrolled', 'X1ENR'),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'X1 other', 'X1OTH')
on conflict (id) do nothing;

insert into public.batch_enrollments (id, batch_id, student_id)
values ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002')
on conflict (id) do nothing;

insert into public.exams (id, batch_id, teacher_id, title, duration_minutes, total_marks, is_published, status, instant_expires_at)
values
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'X1 normal', 60, 1, true, 'active', null),
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'X1 late', 60, 1, true, 'active', null),
  ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'X1 unenrolled', 60, 1, true, 'active', null),
  ('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'X1 duplicate answers', 60, 3, true, 'active', null),
  ('00000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'X1 resumable', 60, 1, true, 'archived', now() - interval '1 minute'),
  ('00000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'X1 saved answer', 60, 1, true, 'active', null)
on conflict (id) do nothing;

insert into public.questions (id, exam_id, question_text, correct_answer, positive_marks)
values
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000030', 'X1 normal question', 'A', 1),
  ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000031', 'X1 foreign question', 'B', 1),
  ('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000033', 'X1 duplicate question', 'A', 3),
  ('00000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000034', 'X1 resume question', 'A', 1),
  ('00000000-0000-0000-0000-000000000044', '00000000-0000-0000-0000-000000000035', 'X1 saved answer question', 'A', 1)
on conflict (id) do nothing;

insert into public.exam_submissions (id, exam_id, student_id, server_end_time, total_score)
values
  ('00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000002', now() + interval '10 minutes', 0),
  ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000002', now() - interval '1 minute', 0),
  ('00000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000002', now() - interval '1 minute', 0),
  ('00000000-0000-0000-0000-000000000053', '00000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000002', now() + interval '10 minutes', 0),
  ('00000000-0000-0000-0000-000000000054', '00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000002', now() + interval '10 minutes', 0)
on conflict (id) do nothing;

insert into public.submission_answers (submission_id, question_id, student_answer)
values
  ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000041', 'B'),
  ('00000000-0000-0000-0000-000000000053', '00000000-0000-0000-0000-000000000044', 'A')
on conflict (submission_id, question_id) do update set student_answer = excluded.student_answer;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', false);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}', false);
set local role authenticated;

select is(
  (select total_score from public.submit_exam(
    '00000000-0000-0000-0000-000000000050'::uuid,
    '[{"question_id":"00000000-0000-0000-0000-000000000040","student_answer":"A"},{"question_id":"00000000-0000-0000-0000-000000000041","student_answer":"B"}]'::jsonb
  )),
  1::numeric,
  'foreign-exam question is ignored'
);

select is(
  (select total_score from public.submit_exam(
    '00000000-0000-0000-0000-000000000050'::uuid,
    '[{"question_id":"00000000-0000-0000-0000-000000000040","student_answer":"wrong"}]'::jsonb
  )),
  1::numeric,
  'double submit returns stored score without regrading'
);

select throws_ok(
  $$update public.exam_submissions set total_score = 999 where id = '00000000-0000-0000-0000-000000000050'::uuid$$,
  '42501'::char(5), null::text,
  'students cannot update their own submission score'
);

select throws_ok(
  $$delete from public.exam_submissions where id = '00000000-0000-0000-0000-000000000050'::uuid$$,
  '42501'::char(5), null::text,
  'students cannot delete their own submission'
);

select is(
  (select total_score from public.submit_exam(
    '00000000-0000-0000-0000-000000000051'::uuid,
    '[{"question_id":"00000000-0000-0000-0000-000000000041","student_answer":"wrong"}]'::jsonb
  )),
  1::numeric,
  'late submission ignores payload and grades saved answer'
);

set local role postgres;
select ok(
  (select is_late from public.exam_submissions where id = '00000000-0000-0000-0000-000000000051'::uuid),
  'late submission is marked late'
);
set local role authenticated;

select throws_ok(
  $$select * from public.start_exam('00000000-0000-0000-0000-000000000032'::uuid)$$,
  'P0001'::char(5), 'Student is not enrolled in this exam'::text,
  'non-enrolled student cannot start exam'
);

select is(
  (select total_score from public.submit_exam(
    '00000000-0000-0000-0000-000000000053'::uuid,
    '[]'::jsonb
  )),
  1::numeric,
  'on-time submit grades previously saved answers absent from payload'
);

select is(
  (select total_score from public.submit_exam(
    '00000000-0000-0000-0000-000000000054'::uuid,
    '[{"question_id":"00000000-0000-0000-0000-000000000042","student_answer":"wrong"},{"question_id":"00000000-0000-0000-0000-000000000042","student_answer":"wrong"},{"question_id":"00000000-0000-0000-0000-000000000042","student_answer":"A"}]'::jsonb
  )),
  3::numeric,
  'last duplicate question answer wins and is graded once'
);

select is(
  (select started.submission_id from public.start_exam('00000000-0000-0000-0000-000000000034'::uuid) as started),
  '00000000-0000-0000-0000-000000000052'::uuid,
  'existing attempt resumes after exam expiry and archive'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', false);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000003","role":"authenticated"}', false);
select throws_ok(
  $$select * from public.start_exam('00000000-0000-0000-0000-000000000030'::uuid)$$,
  'P0001'::char(5), 'Students only'::text,
  'user without a public profile cannot start exam'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}', false);
select throws_ok(
  $$select * from public.start_exam('00000000-0000-0000-0000-000000000030'::uuid)$$,
  'P0001'::char(5), 'Students only'::text,
  'teacher cannot start exam'
);
select is(
  (select count(*)::integer from public.batch_enrollments),
  1,
  'teacher can still see enrollment rows for own batches'
);

set local role anon;
select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '{"role":"anon"}', false);
select throws_ok(
  $$select * from public.submit_exam('00000000-0000-0000-0000-000000000050'::uuid, '[]'::jsonb)$$,
  '42501'::char(5), null::text,
  'anon cannot execute submit_exam'
);

select * from finish();
rollback;
