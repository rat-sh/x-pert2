'use client';
import { Plus, BookOpen, X, RotateCcw, AlertTriangle, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useExamList } from '@/features/exam-list/hooks/useExamList';
import { useExamActions } from '@/features/exam-creator/hooks/useExamActions';
import { ExamCard } from './ExamCard';
import { Spinner } from '@/shared/components/ui/Spinner';
import { supabase } from '@/shared/services/supabase-client';
import type { ExamRow, ActiveModal } from '@/features/exam-creator/types/exam-creator.types';

// ── UpdateSettingsModal ─────────────────────────────────────────────────────
function UpdateSettingsModal({
  exam, onClose, onSave,
}: {
  exam: ExamRow;
  onClose: () => void;
  onSave: (patch: Partial<ExamRow>) => void;
}) {
  const [title, setTitle] = useState(exam.title);
  const [subject, setSubject] = useState(exam.subject ?? '');
  const [duration, setDuration] = useState(exam.duration_minutes);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('exams').update({ title, subject, duration_minutes: duration }).eq('id', exam.id);
    setSaving(false);
    if (error) { toast.error('Failed: ' + error.message); return; }
    toast.success('Settings updated');
    onSave({ title, subject, duration_minutes: duration });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">Update Settings</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (minutes)</label>
            <input type="number" min={5} max={300} value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── PreviewModal ────────────────────────────────────────────────────────────
function ExamPreviewModal({ exam, onClose }: { exam: ExamRow; onClose: () => void }) {
  const [questions, setQuestions] = useState<{ id: string; question_text: string; question_type: string; options?: string[] | null; positive_marks?: number; marks?: number; negative_marks?: number; question_image?: string | null; option_images?: (string | null)[] | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('questions').select('*').eq('exam_id', exam.id).order('order_index')
      .then(({ data }) => { setQuestions(data ?? []); setLoading(false); });
  }, [exam.id]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-semibold text-gray-900">{exam.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Preview · {exam.duration_minutes} min · {exam.total_marks} marks</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {loading ? <div className="flex justify-center py-8"><Spinner /></div>
            : questions.length === 0 ? <p className="text-center text-gray-500 py-8">No questions added.</p>
            : questions.map((q, i) => (
              <div key={q.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start gap-3 mb-2">
                  <span className="shrink-0 text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">Q{i + 1}</span>
                  <p className="text-sm text-gray-900 flex-1">{q.question_text}</p>
                  <span className="text-xs text-green-600 font-semibold shrink-0">+{q.positive_marks ?? q.marks ?? 1}</span>
                </div>
                {q.question_image && <img src={q.question_image} alt="" className="max-h-36 rounded-lg object-contain border border-gray-100 mb-2" />}
                {q.question_type === 'mcq' && q.options && (
                  <div className="space-y-1.5 mt-2">
                    {q.options.map((opt, j) => (
                      <div key={j} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
                        {q.option_images?.[j]
                          ? <img src={q.option_images[j]!} alt="" className="h-10 rounded object-contain" />
                          : <span className="text-gray-700">{opt || <span className="text-gray-400 italic">Empty</span>}</span>
                        }
                      </div>
                    ))}
                  </div>
                )}
                {q.question_type === 'true_false' && (
                  <div className="flex gap-2 mt-2">
                    {['True', 'False'].map((o) => (
                      <div key={o} className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300" />
                        <span>{o}</span>
                      </div>
                    ))}
                  </div>
                )}
                {(q.question_type === 'numerical' || q.question_type === 'theoretical') && (
                  <div className="mt-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-400 italic">
                    {q.question_type === 'numerical' ? 'Student enters a number…' : 'Student writes answer…'}
                  </div>
                )}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

// ── ExamListPage ─────────────────────────────────────────────────────────────

export function ExamListPage({ onCreateNew, onEditExam }: {
  onCreateNew: () => void;
  onEditExam: (exam: ExamRow) => void;
}) {
  const { user } = useAuth();
  const { exams, loading, refresh } = useExamList();
  const { handleDuplicate, handleArchive, handleDelete, handleRegenKey } = useExamActions(user?.id ?? '', refresh);
  const [activeExam, setActiveExam] = useState<ExamRow | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const closeModal = () => { setActiveModal(null); setActiveExam(null); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 text-xl font-semibold">Exams</h2>
          <p className="text-gray-500 text-sm mt-0.5">Manage question papers, keys, and share links</p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Exam
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : exams.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-gray-900 font-semibold text-lg mb-1">No exams yet</h3>
          <p className="text-gray-500 text-sm mb-6">Create your first exam to share with students</p>
          <button onClick={onCreateNew} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" /> Create Exam
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onEdit={() => onEditExam(exam)}
              onSettings={() => { setActiveExam(exam); setActiveModal('settings'); }}
              onPreview={() => { setActiveExam(exam); setActiveModal('preview'); }}
              onDuplicate={() => void handleDuplicate(exam)}
              onRegenKey={() => { setActiveExam(exam); setActiveModal('regen-key'); }}
              onArchive={() => void handleArchive(exam)}
              onDelete={() => { setActiveExam(exam); setActiveModal('confirm-delete'); }}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      {activeModal === 'settings' && activeExam && (
        <UpdateSettingsModal
          exam={activeExam}
          onClose={closeModal}
          onSave={() => refresh()}
        />
      )}

      {activeModal === 'preview' && activeExam && (
        <ExamPreviewModal exam={activeExam} onClose={closeModal} />
      )}

      {activeModal === 'regen-key' && activeExam && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Regenerate Key & PIN?</h3>
                <p className="text-xs text-gray-500">Old key will no longer work</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">Students who had the old key will need the new one. This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={closeModal} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={async () => { await handleRegenKey(activeExam.id); closeModal(); }}
                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600">
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'confirm-delete' && activeExam && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete Exam?</h3>
                <p className="text-xs text-gray-500">This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Permanently delete <span className="font-semibold text-gray-900">&quot;{activeExam.title}&quot;</span> and all its questions?
            </p>
            {activeExam.hasAttempts && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                ⚠ Students have attempted this exam. Their submission data will remain.
              </p>
            )}
            <div className="flex gap-2 mt-5">
              <button onClick={closeModal} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={async () => { await handleDelete(activeExam); closeModal(); }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
