-- 18_todo_items.sql
-- Personal and batch-wide to-do task tracking

create table if not exists public.todo_items (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.users(id) on delete cascade,
  batch_id uuid references public.batches(id) on delete cascade,
  title text not null,
  due_date date,
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  is_done boolean not null default false,
  is_batch_wide boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_todo_items_created_by on public.todo_items(created_by);
create index if not exists idx_todo_items_batch_id on public.todo_items(batch_id);

-- Enable RLS
alter table public.todo_items enable row level security;

-- Policies
create policy "Users can manage their own todo items"
  on public.todo_items
  for all
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "Enrolled students can view batch-wide todo items"
  on public.todo_items
  for select
  to authenticated
  using (
    is_batch_wide = true
    and batch_id is not null
    and exists (
      select 1 from public.batch_enrollments
      where batch_enrollments.batch_id = todo_items.batch_id
      and batch_enrollments.student_id = auth.uid()
    )
  );

