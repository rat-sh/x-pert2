'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { fetchSubmissions, fetchTeacherExams } from '../services/teacher-results.service';

export function useTeacherResults(initialExamId?: string) {
  const { user } = useAuth();
  const [exams, setExams] = useState<{ id: string; title: string; subject?: string | null }[]>([]);
  const [submissions, setSubmissions] = useState<Awaited<ReturnType<typeof fetchSubmissions>>>([]);
  const [loading, setLoading] = useState(true);
  const [examFilter, setExamFilter] = useState(initialExamId ?? '');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [subs, examList] = await Promise.all([
      fetchSubmissions(user.id, examFilter || null),
      fetchTeacherExams(user.id),
    ]);
    setSubmissions(subs);
    setExams(examList);
    setLoading(false);
  }, [user, examFilter]);

  useEffect(() => { void load(); }, [load]);

  // 15-second polling
  useEffect(() => {
    pollingRef.current = setInterval(() => void load(), 15_000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [load]);

  const filtered = submissions.filter((s) => {
    if (!debouncedSearch) return true;
    const name = ((s.users as { full_name?: string } | null)?.full_name ?? '').toLowerCase();
    return name.includes(debouncedSearch.toLowerCase());
  });

  const stats = {
    total: filtered.length,
    avgScore: filtered.length
      ? Math.round(filtered.reduce((acc, r) => acc + (r.score ?? 0), 0) / filtered.length)
      : 0,
    passRate: filtered.length
      ? Math.round(
          (filtered.filter((r) => {
            const total = (r.exams as { total_marks?: number } | null)?.total_marks ?? 100;
            return ((r.score ?? 0) / total) * 100 >= 40;
          }).length / filtered.length) * 100,
        )
      : 0,
  };

  return {
    exams, submissions: filtered, loading,
    examFilter, setExamFilter,
    search, setSearch,
    stats, refresh: load,
  };
}
