'use client';
import { useState } from 'react';
import type { Step } from '../types/exam-creator.types';

export function useExamDraft() {
  const [creating, setCreating]           = useState(false);
  const [savedExamId, setSavedExamId]     = useState<string | null>(null);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [step, setStep]                   = useState<Step>('details');
  const [questionsDirty, setQuestionsDirty] = useState(false);

  const startCreate = () => {
    setSavedExamId(null); setEditingExamId(null);
    setStep('details'); setQuestionsDirty(false); setCreating(true);
  };

  const startEdit = (examId: string) => {
    setSavedExamId(examId); setEditingExamId(examId);
    setStep('questions'); setQuestionsDirty(false); setCreating(true);
  };

  const close = () => {
    setCreating(false); setSavedExamId(null); setEditingExamId(null);
    setStep('details'); setQuestionsDirty(false);
  };

  return {
    creating, savedExamId, setSavedExamId,
    editingExamId, step, setStep,
    questionsDirty, setQuestionsDirty,
    startCreate, startEdit, close,
  };
}
