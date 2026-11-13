-- 20_study_materials.sql
-- Hierarchical study material repository (folders and documents/links)

-- 1. Folders table
create table if not exists public.study_folders (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  batch_id uuid references public.batches(id) on delete set null,
  parent_id uuid references public.study_folders(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- 2. Materials table
create table if not exists public.study_materials (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid not null references public.study_folders(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  title text not null,
  material_type text not null check (material_type in ('pdf', 'video_link', 'note', 'assignment', 'practice_exam')),
  file_url text,
  external_url text,
  description text,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_study_folders_teacher on public.study_folders(teacher_id);
create index if not exists idx_study_folders_parent on public.study_folders(parent_id);
create index if not exists idx_study_folders_batch on public.study_folders(batch_id);
create index if not exists idx_study_materials_folder on public.study_materials(folder_id);
create index if not exists idx_study_materials_teacher on public.study_materials(teacher_id);

-- Enable RLS
alter table public.study_folders enable row level security;
alter table public.study_materials enable row level security;

-- Policies for study_folders
create policy "Teachers can manage their study folders"
  on public.study_folders
  for all
  to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

create policy "Students can view assigned study folders"
  on public.study_folders
  for select
  to authenticated
  using (
    -- Batch specific folder
    (
      batch_id is not null
      and exists (
        select 1 from public.batch_enrollments
        where batch_enrollments.batch_id = study_folders.batch_id
        and batch_enrollments.student_id = auth.uid()
      )
    )
    -- Or global teacher folder accessible to enrolled students
    or (
      batch_id is null
      and exists (
        select 1 from public.batches
        join public.batch_enrollments on batch_enrollments.batch_id = batches.id
        where batches.teacher_id = study_folders.teacher_id
        and batch_enrollments.student_id = auth.uid()
      )
    )
  );

-- Policies for study_materials
create policy "Teachers can manage their study materials"
  on public.study_materials
  for all
  to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

create policy "Students can view accessible study materials"
  on public.study_materials
  for select
  to authenticated
  using (
    exists (
      select 1 from public.study_folders
      where study_folders.id = study_materials.folder_id
      and (
        (
          study_folders.batch_id is not null
          and exists (
            select 1 from public.batch_enrollments
            where batch_enrollments.batch_id = study_folders.batch_id
            and batch_enrollments.student_id = auth.uid()
          )
        )
        or (
          study_folders.batch_id is null
          and exists (
            select 1 from public.batches
            join public.batch_enrollments on batch_enrollments.batch_id = batches.id
            where batches.teacher_id = study_folders.teacher_id
            and batch_enrollments.student_id = auth.uid()
          )
        )
      )
    )
  );
