import { supabase } from '@/shared/services/supabase-client';
import type { ExtractedQuestion } from '../types/extraction.types';

export async function extractQuestionsFromFile(file: File): Promise<{ questions: ExtractedQuestion[]; partial?: boolean }> {
  const { data: { session } } = await supabase.auth.getSession();
  const form = new FormData();
  form.append('file', file);

  const response = await fetch('/api/questions/extract', {
    method: 'POST',
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
    body: form,
  });

  const result = await response.json() as { questions?: ExtractedQuestion[]; error?: string; partial?: boolean };
  if (!response.ok || !result.questions?.length) {
    throw new Error(result.error ?? "Couldn't extract questions from this file.");
  }
  return { questions: result.questions, partial: result.partial };
}
