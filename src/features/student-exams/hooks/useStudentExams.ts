'use client';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useStudent } from '@/contexts/StudentContext';
import { fetchEnrolledExams } from '../services/student-exams.service';
import type { StudentExamRow } from '../types/student-exams.types';

export function useStudentExams() {
  const { student } = useStudent();
  const [exams, setExams] = useState<StudentExamRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!student) {
      setExams([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setExams(await fetchEnrolledExams(student.id));
    } catch {
      toast.error('Could not load your exams');
      setExams([]);
    } finally {
      setLoading(false);
    }
  }, [student]);

  useEffect(() => {
    const task = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(task);
  }, [load]);

  const upcoming  = exams.filter((e) => !e.submission && e.status === 'scheduled');
  const available = exams.filter((e) => !e.submission && (e.status === 'active' || e.is_instant));
  const completed = exams.filter((e) => !!e.submission);

  return { exams, upcoming, available, completed, loading, refresh: load };
}
