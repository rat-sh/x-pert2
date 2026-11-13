import { supabase } from '@/shared/services/supabase-client';
import type { ExamRow } from '@/features/exam-creator/types/exam-creator.types';

export async function fetchExamsWithCounts(teacherId: string): Promise<ExamRow[]> {
  const { data } = await supabase
    .from('exams')
    .select('*, batches(*)')
    .eq('teacher_id', teacherId)
    .neq('status', 'archived')
    .order('created_at', { ascending: false });

  if (!data) return [];

  return Promise.all(
    data.map(async (exam) => {
      const [{ count: qCount }, { count: aCount }] = await Promise.all([
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('exam_id', exam.id),
        supabase.from('exam_submissions').select('*', { count: 'exact', head: true }).eq('exam_id', exam.id),
      ]);
      return { ...exam, questionCount: qCount ?? 0, hasAttempts: (aCount ?? 0) > 0 } as ExamRow;
    }),
  );
}
