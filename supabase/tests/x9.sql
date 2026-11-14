begin;
select plan(5);
set local role postgres;

insert into auth.users (id, aud, role, email, encrypted_password, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000901', 'authenticated', 'authenticated', 'x9-teacher@example.test', '', '{"role":"teacher"}'::jsonb),
  ('00000000-0000-0000-0000-000000000902', 'authenticated', 'authenticated', 'x9-student@example.test', '', '{"role":"student"}'::jsonb)
on conflict (id) do nothing;

insert into public.batches (id, teacher_id, name, join_code)
values ('00000000-0000-0000-0000-000000000910', '00000000-0000-0000-0000-000000000901', 'X9 lifecycle batch', 'X9LIFE')
on conflict (id) do nothing;

insert into public.exams (id, batch_id, teacher_id, title, duration_minutes, total_marks, is_published, status)
values
  ('00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000910', '00000000-0000-0000-0000-000000000901', 'X9 expired lifecycle', 10, 2, true, 'active'),
  ('00000000-0000-0000-0000-000000000915', '00000000-0000-0000-0000-000000000910', '00000000-0000-0000-0000-000000000901', 'X9 fresh lifecycle', 10, 2, true, 'active')
on conflict (id) do nothing;

insert into public.questions (id, exam_id, question_text, correct_answer, positive_marks)
values ('00000000-0000-0000-0000-000000000912', '00000000-0000-0000-0000-000000000911', 'X9 saved answer', 'A', 2)
on conflict (id) do nothing;

insert into public.exam_submissions (id, exam_id, student_id, server_end_time, total_score)
values
  ('00000000-0000-0000-0000-000000000913', '00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000902', now() - interval '2 minutes', 0),
  ('00000000-0000-0000-0000-000000000914', '00000000-0000-0000-0000-000000000915', '00000000-0000-0000-0000-000000000902', now() + interval '10 minutes', 0)
on conflict (id) do nothing;

insert into public.submission_answers (submission_id, question_id, student_answer)
values ('00000000-0000-0000-0000-000000000913', '00000000-0000-0000-0000-000000000912', 'A')
on conflict (submission_id, question_id) do update set student_answer = excluded.student_answer;

select is(public.finalize_expired_submissions(), 1, 'only the expired open submission is finalized');
select is((select total_score from public.exam_submissions where id = '00000000-0000-0000-0000-000000000913'), 2::numeric, 'expired saved answer is graded');
select ok((select is_late and submitted_at is not null from public.exam_submissions where id = '00000000-0000-0000-0000-000000000913'), 'expired attempt is submitted and marked late');
select ok((select submitted_at is null and not is_late from public.exam_submissions where id = '00000000-0000-0000-0000-000000000914'), 'fresh attempt remains untouched');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000902', false);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000902","role":"authenticated"}', false);
set local role authenticated;
select ok(not has_function_privilege(current_user, 'public.finalize_expired_submissions()', 'EXECUTE'), 'students cannot execute expiration finalization');

set local role postgres;
select * from finish();
rollback;
