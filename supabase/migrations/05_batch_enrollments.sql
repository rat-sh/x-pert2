-- ====================================================================
-- 05_batch_enrollments.sql
-- Snippet ID: 1f28a1b0-c3fa-4178-8d56-a3e83de29bf8
-- ====================================================================

create table if not exists public.batch_enrollments (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  is_active boolean not null default true,
  constraint batch_enrollments_unique_student unique (batch_id, student_id)
);

create index if not exists idx_enrollments_student_id on public.batch_enrollments(student_id);
create index if not exists idx_enrollments_batch_id on public.batch_enrollments(batch_id);

-- Stored Procedure: Student joins batch using join code
create or replace function public.join_batch_by_code(p_join_code text)
returns table (
  out_batch_id uuid,
  out_batch_name text,
  out_teacher_name text
)
language plpgsql
security definer
as $$
declare
  v_student_id uuid := auth.uid();
  v_batch record;
  v_teacher_name text;
begin
  if v_student_id is null then
    raise exception 'Unauthorized';
  end if;

  select b.id, b.name, b.teacher_id, b.is_active
  into v_batch
  from public.batches b
  where upper(trim(b.join_code)) = upper(trim(p_join_code))
  limit 1;

  if v_batch.id is null then
    raise exception 'Invalid join code. Please check and try again.';
  end if;

  if not v_batch.is_active then
    raise exception 'This batch is currently inactive.';
  end if;

  insert into public.batch_enrollments (batch_id, student_id, is_active)
  values (v_batch.id, v_student_id, true)
  on conflict (batch_id, student_id)
  do update set is_active = true;

  select u.full_name into v_teacher_name
  from public.users u
  where u.id = v_batch.teacher_id;

  return query
  select v_batch.id, v_batch.name, coalesce(v_teacher_name, 'Teacher');
end;
$$;

-- Enable RLS & Policies
alter table public.batch_enrollments enable row level security;

create policy "Teachers view enrollments for their batches"
  on public.batch_enrollments for select
  using (
    exists (
      select 1 from public.batches
      where batches.id = batch_enrollments.batch_id
        and batches.teacher_id = auth.uid()
    )
  );

create policy "Students view own enrollments"
  on public.batch_enrollments for select
  using (student_id = auth.uid());

create policy "Students can join batches"
  on public.batch_enrollments for insert
  with check (student_id = auth.uid());

