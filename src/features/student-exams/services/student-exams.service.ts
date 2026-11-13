import { supabase } from '@/shared/services/supabase-client';
import type { StudentExamRow, ExamQuestion } from '../types/student-exams.types';

export async function fetchEnrolledExams(studentId: string): Promise<StudentExamRow[]> {
  const { data: enrollments } = await supabase
    .from('batch_enrollments')
    .select('batch_id')
    .eq('student_id', studentId);
  const batchIds = (enrollments ?? []).map((e: { batch_id: string }) => e.batch_id);
  if (!batchIds.length) return [];

  const { data: exams } = await supabase
    .from('exams')
    .select('*, batches(name)')
    .in('batch_id', batchIds)
    .eq('is_published', true)
    .order('scheduled_at');
  if (!exams?.length) return [];

  return Promise.all(exams.map(async (exam) => {
    const { data: sub } = await supabase
      .from('exam_submissions')
      .select('id, score, submitted_at')
      .eq('exam_id', exam.id)
      .eq('student_id', studentId)
      .maybeSingle();
    return { ...exam, batch_name: (exam.batches as { name: string } | null)?.name ?? '', submission: sub ?? null } as StudentExamRow;
  }));
}

export async function fetchExamQuestions(examId: string): Promise<ExamQuestion[]> {
  const { data } = await supabase.from('questions').select('*').eq('exam_id', examId).order('order_index');
  return (data ?? []) as ExamQuestion[];
}

export async function startExam(examId: string, studentId: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from('exam_submissions').select('id').eq('exam_id', examId).eq('student_id', studentId).maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase.rpc('start_exam', { p_exam_id: examId, p_student_id: studentId });
  if (error || !data) return null;
  return typeof data === 'string' ? data : (data as { id?: string })?.id ?? null;
}

export async function submitExam(params: {
  submissionId: string; examId: string; studentId: string; answers: Record<string, string>;
}) {
  const { error } = await supabase.rpc('submit_exam', {
    p_submission_id: params.submissionId, p_exam_id: params.examId,
    p_student_id: params.studentId, p_answers: params.answers,
  });
  return !error;
}
