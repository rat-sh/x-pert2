-- ====================================================================
-- 00_extensions_and_enums.sql
-- Snippet ID: 926acc2d-6b3f-497d-9e9b-b6b40c3573cb
-- ====================================================================

-- Enable Required PostgreSQL Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Common Enums & Types
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('teacher', 'student', 'parent');
  end if;

  if not exists (select 1 from pg_type where typname = 'exam_status') then
    create type public.exam_status as enum ('draft', 'scheduled', 'active', 'completed', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'exam_type') then
    create type public.exam_type as enum ('test', 'pyq_practice', 'mock');
  end if;

  if not exists (select 1 from pg_type where typname = 'question_type') then
    create type public.question_type as enum ('mcq', 'true_false', 'numerical', 'theoretical');
  end if;

  if not exists (select 1 from pg_type where typname = 'difficulty_level') then
    create type public.difficulty_level as enum ('easy', 'medium', 'hard');
  end if;

  if not exists (select 1 from pg_type where typname = 'schedule_type') then
    create type public.schedule_type as enum ('class', 'exam');
  end if;
end $$;

