'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUpcomingExams } from '../services/upcoming-exams.service';

export function useUpcomingExams() {
  const { user } = useAuth();
  const [exams, setExams] = useState<Awaited<ReturnType<typeof fetchUpcomingExams>>>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setExams(await fetchUpcomingExams(user.id));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const task = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(task);
  }, [load]);

  return { exams, loading, refresh: load };
}
