'use client';
import { useState } from 'react';
import type { ExamDetails } from '../types/exam-creator.types';

export const BLANK_DETAILS: ExamDetails = {
  title: '', subject: '', batch_ids: [], duration_minutes: 60,
  scheduled_date: '', scheduled_time: '', is_instant: false, allow_pyq: false,
  no_reverse_back: false, per_question_time_enabled: false, per_question_time_seconds: 60,
};

export function useExamForm(initial?: Partial<ExamDetails>) {
  const [details, setDetails] = useState<ExamDetails>({ ...BLANK_DETAILS, ...initial });

  const setField = <K extends keyof ExamDetails>(key: K, value: ExamDetails[K]) =>
    setDetails((prev) => ({ ...prev, [key]: value }));

  const reset = (next?: Partial<ExamDetails>) =>
    setDetails({ ...BLANK_DETAILS, ...next });

  return { details, setDetails, setField, reset };
}
