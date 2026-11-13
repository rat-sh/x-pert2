-- 16_doubts.sql
-- Student Doubts and Q&A Discussion threads

create table if not exists public.doubts (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  body text not null,
  chapter_tag text,
  is_resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.doubt_replies (
  id uuid primary key default gen_random_uuid(),
  doubt_id uuid not null references public.doubts(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_doubts_batch_id on public.doubts(batch_id);
create index if not exists idx_doubts_student_id on public.doubts(student_id);
create index if not exists idx_doubt_replies_doubt_id on public.doubt_replies(doubt_id);

-- Enable RLS
alter table public.doubts enable row level security;
alter table public.doubt_replies enable row level security;

-- Doubts Policies
create policy "Batch members can view doubts"
  on public.doubts
  for select
  to authenticated
  using (
    student_id = auth.uid()
    or exists (
      select 1 from public.batches
      where batches.id = doubts.batch_id
      and batches.teacher_id = auth.uid()
    )
    or exists (
      select 1 from public.batch_enrollments
      where batch_enrollments.batch_id = doubts.batch_id
      and batch_enrollments.student_id = auth.uid()
    )
  );

create policy "Enrolled students can create doubts"
  on public.doubts
  for insert
  to authenticated
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from public.batch_enrollments
      where batch_enrollments.batch_id = doubts.batch_id
      and batch_enrollments.student_id = auth.uid()
    )
  );

create policy "Authors and teachers can update doubts"
  on public.doubts
  for update
  to authenticated
  using (
    student_id = auth.uid()
    or exists (
      select 1 from public.batches
      where batches.id = doubts.batch_id
      and batches.teacher_id = auth.uid()
    )
  )
  with check (
    student_id = auth.uid()
    or exists (
      select 1 from public.batches
      where batches.id = doubts.batch_id
      and batches.teacher_id = auth.uid()
    )
  );

-- Doubt Replies Policies
create policy "Batch members can view replies"
  on public.doubt_replies
  for select
  to authenticated
  using (
    exists (
      select 1 from public.doubts
      where doubts.id = doubt_replies.doubt_id
      and (
        doubts.student_id = auth.uid()
        or exists (
          select 1 from public.batches
          where batches.id = doubts.batch_id
          and batches.teacher_id = auth.uid()
        )
        or exists (
          select 1 from public.batch_enrollments
          where batch_enrollments.batch_id = doubts.batch_id
          and batch_enrollments.student_id = auth.uid()
        )
      )
    )
  );

create policy "Authenticated batch members can reply to doubts"
  on public.doubt_replies
  for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.doubts
      where doubts.id = doubt_replies.doubt_id
      and (
        doubts.student_id = auth.uid()
        or exists (
          select 1 from public.batches
          where batches.id = doubts.batch_id
          and batches.teacher_id = auth.uid()
        )
        or exists (
          select 1 from public.batch_enrollments
          where batch_enrollments.batch_id = doubts.batch_id
          and batch_enrollments.student_id = auth.uid()
        )
      )
    )
  );

