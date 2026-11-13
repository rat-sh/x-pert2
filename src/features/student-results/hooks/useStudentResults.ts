'use client';
import { useState, useEffect, useCallback } from 'react';
import { useStudent } from '@/contexts/StudentContext';
import { fetchStudentResults, fetchAnswerReview } from '../services/student-results.service';

export function useStudentResults() {
  const { student } = useStudent();
  const [results, setResults] = useState<Awaited<ReturnType<typeof fetchStudentResults>>>([]);
  const [loading, setLoading] = useState(true);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewItems, setReviewItems] = useState<Awaited<ReturnType<typeof fetchAnswerReview>>>([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  const load = useCallback(async () => {
    if (!student) return;
    setLoading(true);
    setResults(await fetchStudentResults(student.id));
    setLoading(false);
  }, [student]);

  useEffect(() => { void load(); }, [load]);

  const openReview = async (submissionId: string) => {
    setReviewId(submissionId);
    setReviewLoading(true);
    setReviewItems(await fetchAnswerReview(submissionId));
    setReviewLoading(false);
  };

  const closeReview = () => { setReviewId(null); setReviewItems([]); };

  const reviewResult = results.find((r) => r.id === reviewId) ?? null;

  return { results, loading, reviewId, reviewResult, reviewItems, reviewLoading, openReview, closeReview, refresh: load };
}
