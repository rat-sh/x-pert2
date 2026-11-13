'use client';
import { useState, useRef } from 'react';
import {
  blankQuestion, blankSection, uid,
} from '../utils/paper-builder.utils';
import type { PaperItem, QuestionItem, SectionItem, QuestionType } from '../types/paper-builder.types';

export function usePaperBuilder(initial: PaperItem[]) {
  const [items, setItems] = useState<PaperItem[]>(initial);
  const [dirty, setDirty] = useState(false);
  const lastTypeRef = useRef<QuestionType>('mcq');

  const onChange = (next: PaperItem[]) => { setItems(next); setDirty(true); };

  const addQuestion = () => {
    const sections = items.filter((i) => i.itemType === 'section') as SectionItem[];
    const last = sections[sections.length - 1] ?? null;
    onChange([...items, blankQuestion(lastTypeRef.current, last?.id ?? null, last)]);
  };

  const addSection = () => onChange([...items, blankSection()]);

  const updateItem = (id: string, patch: Partial<PaperItem>) => {
    const next = items.map((item) => item.id !== id ? item : { ...item, ...patch } as PaperItem);
    if ('question_type' in patch) lastTypeRef.current = (patch as Partial<QuestionItem>).question_type!;
    onChange(next);
  };

  const deleteItem = (id: string) => onChange(items.filter((i) => i.id !== id));

  const duplicateQuestion = (q: QuestionItem) => {
    const copy: QuestionItem = { ...q, id: uid(), dbId: undefined };
    const idx = items.findIndex((i) => i.id === q.id);
    const next = [...items];
    next.splice(idx + 1, 0, copy);
    onChange(next);
  };

  const reset = (next: PaperItem[]) => { setItems(next); setDirty(false); };

  return { items, dirty, setDirty, onChange, addQuestion, addSection, updateItem, deleteItem, duplicateQuestion, reset };
}
