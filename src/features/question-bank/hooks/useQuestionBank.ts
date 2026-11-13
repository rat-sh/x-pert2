'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchBankData } from '../services/question-bank.service';

export function useQuestionBank() {
  const { user } = useAuth();
  const [bank, setBank] = useState<Awaited<ReturnType<typeof fetchBankData>>>([]);
  const [loading, setLoading] = useState(true);
  const [viewingExamId, setViewingExamId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setBank(await fetchBankData(user.id));
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const viewingExam = bank.find((e) => e.id === viewingExamId) ?? null;

  return { bank, loading, viewingExamId, setViewingExamId, viewingExam, refresh: load };
}
