import { supabase } from '@/shared/services/supabase-client';

export type JoinedBatch = {
  id: string;
  name: string;
  subject: string | null;
  teacherName: string;
};

/**
 * Fetches all active batch enrollments for a student,
 * joined with teacher names.
 */
export async function fetchStudentBatches(studentId: string): Promise<JoinedBatch[]> {
  const { data, error } = await supabase
    .from('batch_enrollments')
    .select('batch_id, batches(id, name, subject, teacher_id)')
    .eq('student_id', studentId)
    .eq('is_active', true);

  if (error || !data) return [];

  const raw = (data ?? [])
    .map((row) => row.batches)
    .filter(Boolean) as unknown as Array<{
      id: string;
      name: string;
      subject: string | null;
      teacher_id: string;
    }>;

  const teacherIds = [...new Set(raw.map((b) => b.teacher_id))];
  const { data: teachers } = teacherIds.length
    ? await supabase.from('users').select('id, full_name').in('id', teacherIds)
    : { data: [] as Array<{ id: string; full_name: string }> };

  const teacherNames = new Map(
    (teachers ?? []).map((t) => [t.id, t.full_name]),
  );

  return raw.map((b) => ({
    id: b.id,
    name: b.name,
    subject: b.subject,
    teacherName: teacherNames.get(b.teacher_id) ?? 'Your teacher',
  }));
}

/**
 * Leaves a batch by setting is_active = false in batch_enrollments.
 */
export async function leaveStudentBatch(studentId: string, batchId: string): Promise<boolean> {
  const { error } = await supabase
    .from('batch_enrollments')
    .update({ is_active: false })
    .eq('student_id', studentId)
    .eq('batch_id', batchId);

  return !error;
}
