import { supabase } from '@/shared/services/supabase-client';
import type { StudentExamRow } from '../types/student-exams.types';

export async function fetchEnrolledExams(studentId: string): Promise<StudentExamRow[]> {
  const { data: enrollments, error: enrollmentError } = await supabase
    .from('batch_enrollments')
    .select('batch_id')
    .eq('student_id', studentId)
    .eq('is_active', true);
  if (enrollmentError) throw enrollmentError;

  const batchIds = (enrollments ?? []).map((enrollment) => enrollment.batch_id);
  if (!batchIds.length) return [];

  const [{ data: exams, error: examsError }, { data: batches, error: batchesError }] = await Promise.all([
    supabase
      .from('student_exams_view')
      .select('id, batch_id, batch_ids, title, subject, duration_minutes, total_marks, scheduled_at, is_instant, status, allow_pyq, no_reverse_back, per_question_time_seconds, created_at')
      .order('scheduled_at'),
    supabase.from('batches').select('id, name').in('id', batchIds),
  ]);
  if (examsError) throw examsError;
  if (batchesError) throw batchesError;
  if (!exams?.length) return [];

  const { data: submissions, error: submissionsError } = await supabase
    .from('exam_submissions')
    .select('id, exam_id, total_score, submitted_at')
    .eq('student_id', studentId)
    .in('exam_id', exams.map((exam) => exam.id));
  if (submissionsError) throw submissionsError;

  const batchNames = new Map((batches ?? []).map((batch) => [batch.id, batch.name]));
  const submittedExams = new Map(
    (submissions ?? [])
      .filter((submission) => submission.submitted_at !== null)
      .map((submission) => [submission.exam_id, {
        id: submission.id,
        total_score: submission.total_score,
        submitted_at: submission.submitted_at,
      }]),
  );

  return exams.map((exam) => {
    const matchedBatchId = [exam.batch_id, ...(exam.batch_ids ?? [])]
      .find((batchId): batchId is string => typeof batchId === 'string' && batchNames.has(batchId));
    return {
      ...exam,
      batch_name: matchedBatchId ? batchNames.get(matchedBatchId) : undefined,
      submission: submittedExams.get(exam.id) ?? null,
    };
  });
}
