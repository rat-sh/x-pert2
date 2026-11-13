'use client';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/shared/services/supabase-client';
import { deleteExam, duplicateExam, archiveExam, regenExamKey } from '../services/exam-creator.service';
import type { ExamRow } from '../types/exam-creator.types';

export function useExamActions(teacherId: string, refresh: () => void) {
  const handleDuplicate = useCallback(async (exam: ExamRow) => {
    const ok = await duplicateExam(exam, teacherId);
    if (ok) { toast.success('Exam duplicated!'); refresh(); }
  }, [teacherId, refresh]);

  const handleArchive = useCallback(async (exam: ExamRow) => {
    const ok = await archiveExam(exam);
    if (ok) { toast.success(exam.status === 'archived' ? 'Exam restored.' : 'Exam archived.'); refresh(); }
  }, [refresh]);

  const handleDelete = useCallback(async (exam: ExamRow) => {
    const ok = await deleteExam(exam.id);
    if (ok) { toast.success('Exam deleted.'); refresh(); }
  }, [refresh]);

  const handleRegenKey = useCallback(async (examId: string) => {
    const result = await regenExamKey(examId);
    if (result) { toast.success(`New Key: ${result.key} · PIN: ${result.pin}`); refresh(); }
  }, [refresh]);

  const handleQuickGenerateKey = useCallback(async (exam: ExamRow) => {
    const { data: qs } = await supabase.from('questions').select('positive_marks, marks').eq('exam_id', exam.id);
    const totalMarks = (qs ?? []).reduce((s: number, q: { positive_marks?: number; marks?: number }) => s + (q.positive_marks ?? q.marks ?? 1), 0);
    const result = await regenExamKey(exam.id);
    if (!result) return;
    await supabase.from('exams').update({ status: 'scheduled', is_published: true, total_marks: totalMarks }).eq('id', exam.id);
    toast.success(`Key: ${result.key} · PIN: ${result.pin}`);
    refresh();
  }, [refresh]);

  return { handleDuplicate, handleArchive, handleDelete, handleRegenKey, handleQuickGenerateKey };
}
