begin;
select plan(8);
set local role postgres;

insert into auth.users (id, aud, role, email, encrypted_password, raw_user_meta_data)
values ('00000000-0000-0000-0000-000000000701', 'authenticated', 'authenticated', 'x7-teacher@example.test', '', '{"role":"teacher"}'::jsonb)
on conflict (id) do nothing;
insert into public.batches (id, teacher_id, name, join_code)
values ('00000000-0000-0000-0000-000000000710', '00000000-0000-0000-0000-000000000701', 'X7 batch', 'X7CODE')
on conflict (id) do nothing;
insert into public.exams (id, teacher_id, batch_id, batch_ids, title, duration_minutes)
values ('00000000-0000-0000-0000-000000000711', '00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-000000000710', array['00000000-0000-0000-0000-000000000710'::uuid], 'X7 original', 60)
on conflict (id) do nothing;
insert into public.questions (id, exam_id, question_text, question_type, options, correct_answer, positive_marks, order_index)
values
  ('00000000-0000-0000-0000-000000000712', '00000000-0000-0000-0000-000000000711', 'Old question', 'mcq', '["A","B"]', 'A', 3, 0),
  ('00000000-0000-0000-0000-000000000713', '00000000-0000-0000-0000-000000000711', 'Removed question', 'mcq', '["A","B"]', 'A', 2, 1)
on conflict (id) do nothing;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000701', false);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000701","role":"authenticated"}', false);
set local role authenticated;

select is(public.save_exam_paper(
  '{"id":"00000000-0000-0000-0000-000000000711","teacher_id":"00000000-0000-0000-0000-000000000701","batch_id":"00000000-0000-0000-0000-000000000710","batch_ids":["00000000-0000-0000-0000-000000000710"],"title":"X7 saved","duration_minutes":45}'::jsonb,
  '[{"id":"00000000-0000-0000-0000-000000000712","question_text":"Updated question","question_type":"mcq","options":["A","B"],"correct_answer":"A","positive_marks":4,"negative_marks":0,"order_index":0}]'::jsonb
), '00000000-0000-0000-0000-000000000711'::uuid, 'save RPC returns existing exam id');
select is((select total_marks from public.exams where id = '00000000-0000-0000-0000-000000000711'), 4::numeric, 'save RPC recomputes total marks');
select is((select count(*)::integer from public.questions where exam_id = '00000000-0000-0000-0000-000000000711'), 1, 'save RPC removes questions omitted from paper');

select throws_ok(
  $$select public.save_exam_paper('{"id":"00000000-0000-0000-0000-000000000711","teacher_id":"00000000-0000-0000-0000-000000000701","batch_id":"00000000-0000-0000-0000-000000000710","batch_ids":["00000000-0000-0000-0000-000000000710"],"title":"must rollback","duration_minutes":45}'::jsonb,'[{"question_text":"Bad type","question_type":"unknown","positive_marks":1}]'::jsonb)$$,
  '23514'::char(5), null::text, 'invalid question rolls back complete exam save'
);
select is((select title from public.exams where id = '00000000-0000-0000-0000-000000000711'), 'X7 saved'::text, 'failed save leaves previous exam unchanged');
select lives_ok(
  $$select public.duplicate_exam('00000000-0000-0000-0000-000000000711')$$,
  'teacher can duplicate own exam using RPC'
);
select is((select count(*)::integer from public.exams where title = 'X7 saved (Copy)' and teacher_id = auth.uid()), 1,
  'duplicate RPC creates a draft copy');
select is((select count(*)::integer from public.questions q join public.exams e on e.id = q.exam_id where e.title = 'X7 saved (Copy)' and e.teacher_id = auth.uid()), 1,
  'duplicate RPC copies the complete question paper');

select * from finish();
rollback;
