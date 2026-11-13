-- ====================================================================
-- 00_helper_functions.sql
-- Snippet ID: bc511b8f-e311-4e1e-b5d3-9e2ba4a540c9
-- ====================================================================

-- Function: Automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Function: Generate short random alphanumeric codes (e.g. for join codes or exam PINs)
create or replace function public.generate_alphanumeric_code(p_length integer default 6)
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer := 0;
begin
  for i in 1..p_length loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  end loop;
  return result;
end;
$$;

-- Function: Quick helper to get authenticated user role
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
as $$
  select role from public.users where id = auth.uid();
$$;

