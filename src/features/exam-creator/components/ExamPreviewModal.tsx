import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/shared/services/supabase-client';
import { ExamRow } from '../types/exam-creator.types';

interface ExamPreviewModalProps {
  exam: ExamRow;
  onClose: () => void;
}

interface PreviewQuestion {
  id: string;
  question_text: string;
  question_image?: string | null;
  question_type: string;
  options: string[] | null;
  option_images?: (string | null)[] | null;
  positive_marks?: number;
  marks: number;
  negative_marks?: number;
}

export function ExamPreviewModal({ exam, onClose }: ExamPreviewModalProps) {
  const [questions, setQuestions] = useState<PreviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('questions').select('*').eq('exam_id', exam.id).order('order_index').then(({ data }) => {
      setQuestions(data ?? []);
      setLoading(false);
    });
  }, [exam.id]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h3 className="font-semibold text-gray-900">{exam.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Student Preview · {exam.duration_minutes} min · {exam.total_marks} marks</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {questions.length === 0 && <p className="text-center text-gray-500 py-8">No questions added yet.</p>}
            {questions.map((q, i) => (
              <div key={q.id} className="border border-gray-200 rounded-xl p-5">
                <div className="flex items-start gap-3 mb-3">
                  <span className="shrink-0 text-xs font-bold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg">Q{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 font-medium">{q.question_text}</p>
                    {q.question_image && <img src={q.question_image} alt="" className="mt-2 max-h-48 rounded-lg object-contain border border-gray-100" />}
                  </div>
                  <div className="text-xs text-gray-400 shrink-0 text-right">
                    <span className="text-green-600 font-semibold">+{q.positive_marks ?? q.marks}</span>
                    {(q.negative_marks ?? 0) > 0 && <span className="text-red-500 font-semibold ml-1">−{q.negative_marks}</span>}
                  </div>
                </div>
                {q.question_type === 'mcq' && q.options && (
                  <div className="space-y-2 mt-3">
                    {q.options.map((opt, j) => {
                      const imgUrl = q.option_images?.[j];
                      return (
                        <div key={j} className="flex items-center gap-3 px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                          {imgUrl
                            ? <img src={imgUrl} alt={`opt ${j + 1}`} className="h-14 rounded object-contain" />
                            : <span className="text-sm text-gray-700">{opt || <span className="text-gray-400 italic">Empty option</span>}</span>
                          }
                        </div>
                      );
                    })}
                  </div>
                )}
                {q.question_type === 'true_false' && (
                  <div className="flex gap-3 mt-3">
                    {['True', 'False'].map((o) => (
                      <div key={o} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                        <span className="text-sm text-gray-700">{o}</span>
                      </div>
                    ))}
                  </div>
                )}
                {(q.question_type === 'numerical' || q.question_type === 'theoretical') && (
                  <div className="mt-3 px-3 py-3 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-400 italic">
                    {q.question_type === 'numerical' ? 'Student enters a number here…' : 'Student writes their answer here…'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
