-- X4: constrain profile visibility and enrollment changes to trusted paths.

drop policy if exists "Users can view all user profiles" on public.users;
drop policy if exists "Users view permitted profiles" on public.users;
create policy "Users view permitted profiles"
  on public.users for select
  to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.batch_enrollments be
      join public.batches b on b.id = be.batch_id
      where b.teacher_id = auth.uid()
        and be.student_id = users.id
        and be.is_active
    )
    or exists (
      select 1 from public.batch_enrollments be
      join public.batches b on b.id = be.batch_id
      where be.student_id = auth.uid()
        and b.teacher_id = users.id
        and be.is_active
    )
  );

revoke all on public.users from anon, public;
revoke select on public.users from authenticated;
grant select (id, full_name, role, email, preferred_language, created_at)
  on public.users to authenticated;

create or replace function public.get_my_user_profile()
returns table (
  id uuid,
  full_name text,
  role text,
  email text,
  phone text,
  preferred_language text,
  date_of_birth date,
  pin_hash text,
  pin_set_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.full_name, u.role, u.email, u.phone, u.preferred_language,
         u.date_of_birth, u.pin_hash, u.pin_set_at, u.created_at
  from public.users u
  where u.id = auth.uid();
$$;
revoke execute on function public.get_my_user_profile() from public, anon;
grant execute on function public.get_my_user_profile() to authenticated;

create or replace function public.prevent_user_privilege_changes()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    raise exception 'Role cannot be changed';
  end if;
  if new.pin_hash is distinct from old.pin_hash then
    raise exception 'PIN hash cannot be changed directly';
  end if;
  return new;
end;
$$;
drop trigger if exists prevent_user_privilege_changes on public.users;
create trigger prevent_user_privilege_changes
  before update on public.users
  for each row execute function public.prevent_user_privilege_changes();

drop policy if exists "Students can join batches" on public.batch_enrollments;
revoke insert on public.batch_enrollments from anon, authenticated;

create or replace function public.join_batch_by_code(p_join_code text)
returns table (
  out_batch_id uuid,
  out_batch_name text,
  out_teacher_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid := auth.uid();
  v_batch record;
  v_teacher_name text;
  v_existing_active boolean;
begin
  if v_student_id is null or public.current_user_role() is distinct from 'student' then
    raise exception 'Students only';
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

  select be.is_active into v_existing_active
  from public.batch_enrollments be
  where be.batch_id = v_batch.id and be.student_id = v_student_id;

  if found and not v_existing_active then
    raise exception 'removed by teacher';
  end if;
  if not found then
    insert into public.batch_enrollments (batch_id, student_id, is_active)
    values (v_batch.id, v_student_id, true)
    on conflict (batch_id, student_id) do nothing;
  end if;

  select u.full_name into v_teacher_name
  from public.users u where u.id = v_batch.teacher_id;

  return query select v_batch.id, v_batch.name, coalesce(v_teacher_name, 'Teacher');
end;
$$;
revoke execute on function public.join_batch_by_code(text) from public, anon;
grant execute on function public.join_batch_by_code(text) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
  v_role text;
  v_phone text;
begin
  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  v_role := coalesce(new.raw_user_meta_data->>'role', 'student');
  if v_role not in ('student', 'teacher') then
    v_role := 'student';
  end if;
  v_phone := new.raw_user_meta_data->>'phone';

  insert into public.users (id, full_name, role, email, phone)
  values (new.id, v_full_name, v_role, new.email, v_phone)
  on conflict (id) do update
  set full_name = excluded.full_name,
      email = excluded.email,
      phone = coalesce(excluded.phone, public.users.phone);

  return new;
end;
$$;
