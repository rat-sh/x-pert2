'use client';
import { useRef, useState } from 'react';
import { FileUp, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/shared/services/supabase-client';

export type ExtractedQuestion = {
  question_text: string;
  question_type: 'mcq' | 'true_false' | 'numerical' | 'theoretical';
  options: string[];
  correct_answer: string;
  marks: number;
  positive_marks: number;
  negative_marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  chapter_tag?: string;
  section_title?: string;
};

export function QuestionExtractionUpload({ onExtracted }: { onExtracted: (questions: ExtractedQuestion[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const extract = async (file: File) => {
    setLoading(true);
    try {
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
        toast.error(result.error ?? "Couldn't extract questions from this file. Try manual entry.");
        return;
      }
      onExtracted(result.questions);
      toast.success(`${result.questions.length} question${result.questions.length === 1 ? '' : 's'} extracted for review.${result.partial ? ' Some answers need checking.' : ''}`);
    } catch {
      toast.error("Couldn't extract questions from this file. Try manual entry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-indigo-300 bg-indigo-50/40 p-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-900">Import questions with AI</p>
        <p className="text-xs text-gray-500 mt-1">
          Upload a PDF, image, or Word document. Extracted questions stay editable until you save.
        </p>
      </div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={loading}
        className="shrink-0 px-3 py-2 rounded-lg text-sm bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 flex gap-2 items-center"
      >
        {loading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
        {loading ? 'Extracting…' : 'Upload file'}
      </button>
      <input
        ref={input} type="file" className="hidden"
        accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,.doc,.docx"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void extract(f); e.currentTarget.value = ''; }}
      />
    </div>
  );
}
