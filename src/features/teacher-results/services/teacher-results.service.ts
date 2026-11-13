import { supabase } from '@/shared/services/supabase-client';

export async function fetchSubmissions(teacherId: string, examId?: string | null) {
  let query = supabase
    .from('exam_submissions')
    .select('*, exams(title, subject, total_marks, teacher_id), users(full_name, email)')
    .order('submitted_at', { ascending: false });

  if (examId) {
    query = query.eq('exam_id', examId);
  }

  const { data } = await query;
  // Filter by teacher on client side since join filter syntax varies
  const all = data ?? [];
  if (!examId) {
    return all.filter(
      (s: { exams?: { teacher_id?: string } | null }) => s.exams?.teacher_id === teacherId,
    );
  }
  return all;
}

export async function fetchTeacherExams(teacherId: string) {
  const { data } = await supabase
    .from('exams')
    .select('id, title, subject')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function fetchAnswerDetail(submissionId: string) {
  const { data } = await supabase
    .from('submission_answers')
    .select('*')
    .eq('submission_id', submissionId)
    .order('question_order');
  return data ?? [];
}
