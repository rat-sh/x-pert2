'use client';
import { useState, useEffect, useCallback } from 'react';
import { useStudent } from '@/contexts/StudentContext';
import { fetchEnrolledExams } from '../services/student-exams.service';
import type { StudentExamRow } from '../types/student-exams.types';

export function useStudentExams() {
  const { student } = useStudent();
  const [exams, setExams] = useState<StudentExamRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!student) return;
    setLoading(true);
    setExams(await fetchEnrolledExams(student.id));
    setLoading(false);
  }, [student]);

  useEffect(() => { void load(); }, [load]);

  const upcoming  = exams.filter((e) => !e.submission && e.status === 'scheduled');
  const available = exams.filter((e) => !e.submission && (e.status === 'active' || e.is_instant));
  const completed = exams.filter((e) => !!e.submission);

  return { exams, upcoming, available, completed, loading, refresh: load };
}
