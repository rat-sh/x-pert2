-- 17_payment_logs.sql
-- Fee and tuition payment tracking for batch students

create table if not exists public.payment_logs (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  month text not null,
  is_paid boolean not null default false,
  marked_by uuid not null references public.users(id),
  marked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint unique_batch_student_month unique (batch_id, student_id, month)
);

-- Indexes
create index if not exists idx_payment_logs_batch_id on public.payment_logs(batch_id);
create index if not exists idx_payment_logs_student_id on public.payment_logs(student_id);

-- Enable RLS
alter table public.payment_logs enable row level security;

-- Policies
create policy "Teachers can manage payments for their batches"
  on public.payment_logs
  for all
  to authenticated
  using (
    exists (
      select 1 from public.batches
      where batches.id = payment_logs.batch_id
      and batches.teacher_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.batches
      where batches.id = payment_logs.batch_id
      and batches.teacher_id = auth.uid()
    )
  );

create policy "Students can view their own payment status"
  on public.payment_logs
  for select
  to authenticated
  using (student_id = auth.uid());

