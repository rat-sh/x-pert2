'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchExamsWithCounts } from '../services/exam-list.service';
import type { ExamRow } from '@/features/exam-creator/types/exam-creator.types';

export function useExamList() {
  const { user } = useAuth();
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await fetchExamsWithCounts(user.id);
    setExams(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { exams, loading, refresh };
}
