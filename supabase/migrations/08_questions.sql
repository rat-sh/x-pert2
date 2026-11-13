-- ====================================================================
-- 08_questions.sql
-- Snippet ID: 2902be3d-94ac-404c-94bc-26d26022d604
-- ====================================================================

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references public.exams(id) on delete cascade,
  pyq_bank_id uuid,
  question_text text not null,
  question_type text not null default 'mcq' check (question_type in ('mcq', 'true_false', 'numerical', 'theoretical')),
  options jsonb default '[]'::jsonb,
  correct_answer text,
  marks numeric not null default 1,
  positive_marks numeric not null default 1,
  negative_marks numeric not null default 0,
  option_images jsonb,
  question_image text,
  chapter_tag text,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  order_index integer not null default 0,
  is_pyq boolean not null default false,
  section_title text,
  created_at timestamptz not null default now()
);

create index if not exists idx_questions_exam_id on public.questions(exam_id);
create index if not exists idx_questions_order on public.questions(exam_id, order_index);

-- Secure student view: masks correct_answer so inspect element cannot reveal it
create or replace view public.student_questions_view as
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
  is_pyq,
  section_title
from public.questions;

-- Enable RLS & Policies
alter table public.questions enable row level security;

create policy "Teachers manage questions for own exams"
  on public.questions for all
  using (
    exists (
      select 1 from public.exams
      where exams.id = questions.exam_id
        and exams.teacher_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.exams
      where exams.id = questions.exam_id
        and exams.teacher_id = auth.uid()
    )
  );

create policy "Students view questions via exam enrollment"
  on public.questions for select
  using (
    exists (
      select 1 from public.exams e
      left join public.batch_enrollments be on be.batch_id = e.batch_id
      where e.id = questions.exam_id
        and e.is_published = true
        and (be.student_id = auth.uid() or e.batch_id is null)
    )
  );

