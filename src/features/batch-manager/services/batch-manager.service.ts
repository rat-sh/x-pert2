import { supabase } from '@/shared/services/supabase-client';
import { Batch, BatchStudent, BatchFormData } from '../types/batch.types';
import { generateJoinCode, getDatesForDays } from '../utils/batch.utils';

export async function fetchBatches(userId: string): Promise<Batch[]> {
  const { data, error } = await supabase
    .from('batches')
    .select('*')
    .eq('teacher_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Batch[]) ?? [];
}

export async function fetchStudents(batchId: string): Promise<BatchStudent[]> {
  const { data: enrollments, error } = await supabase
    .from('batch_enrollments')
    .select('student_id, enrolled_at, users(full_name, phone)')
    .eq('batch_id', batchId)
    .eq('is_active', true);

  if (error) throw error;
  const students: BatchStudent[] = [];
  (enrollments ?? []).forEach((enrollment) => {
    const member = Array.isArray(enrollment.users) ? enrollment.users[0] : enrollment.users;
    students.push({
      student_id: enrollment.student_id,
      name: member?.full_name ?? 'Student',
      phone: member?.phone ?? null,
      joined_at: enrollment.enrolled_at,
      batch_id: batchId,
    });
  });
  return students;
}

export async function fetchBatchesAndStudents(userId: string): Promise<{ batches: Batch[]; students: BatchStudent[] }> {
  const batchData = await fetchBatches(userId);
  const allStudents: BatchStudent[] = [];

  for (const b of batchData) {
    const students = await fetchStudents(b.id);
    allStudents.push(...students);
  }

  const batches = batchData.map((batch) => ({
    ...batch,
    studentCount: allStudents.filter((student) => student.batch_id === batch.id).length,
  }));

  return { batches, students: allStudents };
}

export async function createBatch(params: { teacherId: string; name: string; subject?: string; joinCode?: string }): Promise<Batch> {
  const joinCode = params.joinCode || generateJoinCode(params.name);
  const { data, error } = await supabase
    .from('batches')
    .insert({
      teacher_id: params.teacherId,
      name: params.name.trim(),
      subject: params.subject?.trim() || null,
      join_code: joinCode,
      is_active: true,
    })
    .select()
    .single();

  if (error || !data) throw error ?? new Error('Failed to create batch');
  return data as Batch;
}

export async function createBatchService(userId: string, form: BatchFormData): Promise<{ newBatch: Batch; calendarCount: number }> {
  const newBatch = await createBatch({ teacherId: userId, name: form.name, subject: form.subject });

  let calendarCount = 0;
  if (form.classTime && form.startDate && form.endDate && form.selectedDays.length > 0) {
    const dates = getDatesForDays(form.startDate, form.endDate, form.selectedDays);
    if (dates.length > 0) {
      const calRows = dates.map((d: string) => ({
        teacher_id: userId,
        batch_name: form.name.trim(),
        subject: form.subject.trim() || form.name.trim(),
        schedule_date: d,
        start_time: form.classTime,
        duration: form.duration || '1 hour',
        type: 'class' as const,
      }));

      const { error: calErr } = await supabase.from('calendar_schedules').insert(calRows);
      if (calErr) throw calErr;
      calendarCount = dates.length;
    }
  }

  return { newBatch: { ...newBatch, studentCount: 0 }, calendarCount };
}

export async function removeStudentFromBatch(studentId: string, batchId?: string): Promise<void> {
  let query = supabase.from('batch_enrollments').update({ is_active: false }).eq('student_id', studentId);
  if (batchId) {
    query = query.eq('batch_id', batchId);
  }
  const { error } = await query;
  if (error) throw error;
}

export async function removeStudentFromBatchService(studentId: string, batchId: string): Promise<void> {
  await removeStudentFromBatch(studentId, batchId);
}

export async function deleteBatch(batchId: string): Promise<void> {
  const { data: batch } = await supabase.from('batches').select('name').eq('id', batchId).single();
  if (batch?.name) {
    await supabase.from('calendar_schedules').delete().eq('batch_name', batch.name);
  }
  const { error } = await supabase.from('batches').delete().eq('id', batchId);
  if (error) throw error;
}

export async function deleteBatchService(batchId: string, batchName: string): Promise<void> {
  await supabase.from('calendar_schedules').delete().eq('batch_name', batchName);
  const { error } = await supabase.from('batches').delete().eq('id', batchId);
  if (error) throw error;
}
