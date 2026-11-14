begin;

select plan(10);

select has_table('public', 'users', 'users table exists');
select has_table('public', 'batches', 'batches table exists');
select has_table('public', 'batch_enrollments', 'batch_enrollments table exists');
select has_table('public', 'exams', 'exams table exists');
select has_table('public', 'questions', 'questions table exists');
select has_table('public', 'exam_submissions', 'exam_submissions table exists');
select has_table('public', 'submission_answers', 'submission_answers table exists');
select has_function('public', 'start_exam', array['uuid']::name[], 'start_exam RPC exists');
select has_function('public', 'submit_exam', array['uuid', 'jsonb']::name[], 'submit_exam RPC exists');
select has_function('public', 'join_batch_by_code', array['text']::name[], 'join_batch_by_code RPC exists');

select * from finish();
rollback;
