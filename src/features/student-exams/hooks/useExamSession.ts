'use client';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { fetchExamQuestions, startExam, submitExam } from '../services/student-exams.service';
import type { ExamQuestion, StudentExamRow } from '../types/student-exams.types';

export function useExamSession() {
  const [exam, setExam]           = useState<StudentExamRow | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [submissionId, setSub]    = useState<string | null>(null);
  const [answers, setAnswers]     = useState<Record<string, string>>({});
  const [currentIdx, setIdx]      = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [loading, setLoading]       = useState(false);

  const begin = useCallback(async (studentId: string, selectedExam: StudentExamRow) => {
    setLoading(true);
    const [qs, subId] = await Promise.all([
      fetchExamQuestions(selectedExam.id),
      startExam(selectedExam.id, studentId),
    ]);
    if (!subId) { toast.error('Could not start exam. Please try again.'); setLoading(false); return false; }
    setExam(selectedExam); setQuestions(qs); setSub(subId);
    setAnswers({}); setIdx(0); setSubmitted(false); setLoading(false);
    return true;
  }, []);

  const setAnswer = (qId: string, answer: string) => setAnswers((p) => ({ ...p, [qId]: answer }));
  const goNext    = () => setIdx((i) => Math.min(i + 1, questions.length - 1));
  const goPrev    = () => setIdx((i) => Math.max(i - 1, 0));
  const goTo      = (idx: number) => setIdx(idx);

  const submit = useCallback(async (studentId: string) => {
    if (!submissionId || !exam) return;
    setSubmitting(true);
    const ok = await submitExam({ submissionId, examId: exam.id, studentId, answers });
    setSubmitting(false);
    if (ok) { setSubmitted(true); toast.success('Exam submitted successfully!'); }
    else toast.error('Submission failed. Please try again.');
  }, [submissionId, exam, answers]);

  const reset = () => { setExam(null); setQuestions([]); setSub(null); setAnswers({}); setIdx(0); setSubmitted(false); };

  return {
    exam, questions, answers, currentIdx, submitting, submitted, loading,
    begin, setAnswer, goNext, goPrev, goTo, submit, reset,
    currentQuestion: questions[currentIdx] ?? null,
    answeredCount: Object.keys(answers).length,
  };
}
