import { supabase } from '@/shared/services/supabase-client';

export async function fetchStudentResults(studentId: string) {
  const { data } = await supabase
    .from('exam_submissions')
    .select('*, exams(title, subject, total_marks, scheduled_at)')
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: false });
  return data ?? [];
}

export async function fetchAnswerReview(submissionId: string) {
  const { data } = await supabase
    .from('submission_answers')
    .select('*')
    .eq('submission_id', submissionId)
    .order('question_order');
  return data ?? [];
}
