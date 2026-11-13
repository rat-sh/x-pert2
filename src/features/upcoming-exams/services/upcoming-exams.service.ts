import { supabase } from '@/shared/services/supabase-client';

export async function fetchUpcomingExams(teacherId: string) {
  const { data } = await supabase
    .from('exams')
    .select('*, batches(*)')
    .eq('teacher_id', teacherId)
    .in('status', ['scheduled', 'active'])
    .order('scheduled_at');
  if (!data) return [];
  return Promise.all(
    data.map(async (exam) => {
      const { count } = await supabase
        .from('exam_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('exam_id', exam.id);
      return { ...exam, attemptCount: count ?? 0 };
    }),
  );
}
