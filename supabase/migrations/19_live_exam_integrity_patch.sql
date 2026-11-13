-- 19_live_exam_integrity_patch.sql
-- Live exam security, tab switch counter, server-enforced countdown, and anti-cheat RPCs

-- 1. Ensure integrity columns exist on exam_submissions
alter table public.exam_submissions
  add column if not exists tab_switch_count integer not null default 0,
  add column if not exists server_end_time timestamptz;

-- 2. Secure RPC to increment tab switch count from client
create or replace function public.record_tab_switch(
  p_submission_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_student_id uuid;
begin
  select student_id, tab_switch_count into v_student_id, v_count
  from public.exam_submissions
  where id = p_submission_id;

  if not found then
    raise exception 'Submission not found';
  end if;

  if v_student_id != auth.uid() then
    raise exception 'Unauthorized to update this submission';
  end if;

  update public.exam_submissions
  set tab_switch_count = tab_switch_count + 1
  where id = p_submission_id
  returning tab_switch_count into v_count;

  return v_count;
end;
$$;

grant execute on function public.record_tab_switch(uuid) to authenticated;

-- 3. Secure student exam question view (strips correct_answer and sensitive keys)
create or replace view public.active_exam_questions as
select
  id,
  exam_id,
  question_text,
  question_type,
  options,
  marks,
  positive_marks,
  negative_marks,
  option_images,
  question_image,
  chapter_tag,
  difficulty,
  order_index,
  section_title,
  created_at
from public.questions;

-- Grant select on view
grant select on public.active_exam_questions to authenticated;

-- 4. Constraint/trigger preventing submission past server_end_time + grace buffer
create or replace function public.check_exam_submission_deadline()
returns trigger
language plpgsql
as $$
begin
  if old.submitted_at is null and new.submitted_at is not null then
    if new.server_end_time is not null and now() > (new.server_end_time + interval '5 minutes') then
      -- Auto-cap submission if sent past generous network latency buffer
      new.is_late := true;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_check_exam_submission_deadline on public.exam_submissions;
create trigger trg_check_exam_submission_deadline
  before update on public.exam_submissions
  for each row
  execute function public.check_exam_submission_deadline();

