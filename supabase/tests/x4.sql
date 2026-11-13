begin;

select plan(8);
set local role postgres;

insert into auth.users (id, aud, role, email, encrypted_password, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000201', 'authenticated', 'authenticated', 'x4-teacher@example.test', '', '{"role":"teacher","full_name":"X4 Teacher"}'::jsonb),
  ('00000000-0000-0000-0000-000000000202', 'authenticated', 'authenticated', 'x4-student@example.test', '', '{"role":"student","full_name":"X4 Student","phone":"1234567890"}'::jsonb),
  ('00000000-0000-0000-0000-000000000203', 'authenticated', 'authenticated', 'x4-outsider@example.test', '', '{"role":"student","full_name":"X4 Outsider"}'::jsonb)
on conflict (id) do nothing;
insert into public.batches (id, teacher_id, name, join_code)
values ('00000000-0000-0000-0000-000000000210', '00000000-0000-0000-0000-000000000201', 'X4 batch', 'X4CODE')
on conflict (id) do nothing;
insert into public.batch_enrollments (id, batch_id, student_id, is_active)
values ('00000000-0000-0000-0000-000000000220', '00000000-0000-0000-0000-000000000210', '00000000-0000-0000-0000-000000000202', true)
on conflict (id) do update set is_active = true;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000202', false);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000202","role":"authenticated"}', false);
set local role authenticated;

select throws_ok(
  $$update public.users set role = 'teacher' where id = auth.uid()$$,
  'P0001'::char(5), 'Role cannot be changed'::text,
  'student cannot change own role'
);
select throws_ok(
  $$update public.users set pin_hash = 'tampered' where id = auth.uid()$$,
  'P0001'::char(5), 'PIN hash cannot be changed directly'::text,
  'student cannot change own PIN hash'
);
select throws_ok(
  $$insert into public.batch_enrollments (batch_id, student_id) values ('00000000-0000-0000-0000-000000000210'::uuid, auth.uid())$$,
  '42501'::char(5), null::text,
  'student cannot directly insert an enrollment'
);
select is_empty(
  $$select email from public.users where id = '00000000-0000-0000-0000-000000000203'::uuid$$,
  'student cannot select unrelated student email'
);
select is((select phone from public.get_my_user_profile()), '1234567890'::text,
  'own profile RPC returns own sensitive phone value');
select is((select count(*)::integer from public.users where id = '00000000-0000-0000-0000-000000000201'::uuid), 1,
  'student can see own batch teacher profile');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000201', false);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000201","role":"authenticated"}', false);
select is((select count(*)::integer from public.users where id = '00000000-0000-0000-0000-000000000202'::uuid), 1,
  'teacher can see enrolled student profile');

set local role postgres;
update public.batch_enrollments set is_active = false
where id = '00000000-0000-0000-0000-000000000220'::uuid;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000202', false);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000202","role":"authenticated"}', false);
select throws_ok(
  $$select * from public.join_batch_by_code('X4CODE')$$,
  'P0001'::char(5), 'removed by teacher'::text,
  'removed enrollment is not silently reactivated'
);

select * from finish();
rollback;
