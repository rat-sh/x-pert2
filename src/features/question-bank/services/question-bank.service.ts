import { supabase } from '@/shared/services/supabase-client';

export async function fetchBankData(teacherId: string) {
  const { data: exams } = await supabase
    .from('exams')
    .select('id, title, subject, total_marks, created_at, status')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });

  if (!exams?.length) return [];

  return Promise.all(
    exams.map(async (exam) => {
      const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', exam.id)
        .order('order_index');
      return { ...exam, questions: questions ?? [] };
    }),
  );
}
