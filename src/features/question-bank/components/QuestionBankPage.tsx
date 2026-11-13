'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Archive, BookOpen, Eye, Trash2, Plus, X, Edit2, Save, Copy,
  ChevronDown, FileText, Calendar, Clock, MoreVertical,
  Check, List, AlignLeft, Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/shared/services/supabase-client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { QuestionExtractionUpload } from '@/features/question-extraction/components/QuestionExtractionUpload';
import type { ExtractedQuestion } from '@/features/question-extraction/types/extraction.types';
import type { Exam, Question } from '@/shared/types/database.types';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface ExamBankRow extends Exam {
  questionCount: number;
  questions: Question[];
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function statusBadge(status: string | undefined) {
  switch (status) {
    case 'scheduled': return { label: 'Scheduled', cls: 'bg-indigo-100 text-indigo-700' };
    case 'active':    return { label: 'Active',    cls: 'bg-green-100 text-green-700' };
    case 'completed': return { label: 'Completed', cls: 'bg-purple-100 text-purple-700' };
    case 'archived':  return { label: 'Archived',  cls: 'bg-gray-100 text-gray-500' };
    default:          return { label: 'Draft',     cls: 'bg-amber-100 text-amber-700' };
  }
}

function diffColor(d: string | null) {
  if (d === 'easy') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (d === 'hard') return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-amber-100 text-amber-700 border-amber-200';
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ─── Question Card (Figma-style — matches Exam Builder) ─────────────── */

function QuestionViewCard({ q, index }: { q: Question; index: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group relative">
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="p-5">
        <div className="flex gap-4">
          {/* Left: question content */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg shrink-0 mt-0.5">
                Q{index + 1}
              </span>
              <div className="flex-1 space-y-2">
                <p className="text-sm text-gray-900 font-medium leading-relaxed">{q.question_text}</p>
                {q.question_image && (
                  <img src={q.question_image} alt="question" className="h-24 rounded-lg border border-gray-200 object-contain bg-gray-50" />
                )}
              </div>
            </div>

            {/* MCQ Options */}
            {q.question_type === 'mcq' && q.options && q.options.length > 0 && (
              <div className="ml-9 space-y-2">
                {q.options.map((opt, i) => {
                  const isCorrect = opt === q.correct_answer;
                  const imgUrl = q.option_images?.[i];
                  return (
                    <div key={i}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm border transition-colors ${
                        isCorrect
                          ? 'border-green-300 bg-green-50 text-green-800'
                          : 'border-gray-200 bg-gray-50/50 text-gray-700'
                      }`}>
                      <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isCorrect ? 'border-green-500 bg-green-500' : 'border-gray-300'
                      }`}>
                        {isCorrect && <Check className="w-3 h-3 text-white" />}
                      </div>
                      {imgUrl
                        ? <img src={imgUrl} alt={`opt ${i + 1}`} className="h-14 rounded object-contain" />
                        : <span>{String.fromCharCode(65 + i)}. {opt}</span>
                      }
                      {isCorrect && <span className="ml-auto text-xs font-semibold text-green-600">✓ Correct</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* True/False */}
            {q.question_type === 'true_false' && (
              <div className="ml-9 flex gap-3">
                {['True', 'False'].map((o) => {
                  const isCorrect = q.correct_answer === o;
                  return (
                    <div key={o} className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm ${
                      isCorrect ? 'border-green-300 bg-green-50 text-green-800 font-medium' : 'border-gray-200 bg-gray-50 text-gray-700'
                    }`}>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isCorrect ? 'border-green-500 bg-green-500' : 'border-gray-300'
                      }`}>
                        {isCorrect && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      {o}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Numerical */}
            {q.question_type === 'numerical' && q.correct_answer && (
              <div className="ml-9 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                <strong>Answer:</strong> {q.correct_answer}
              </div>
            )}

            {/* Theoretical */}
            {q.question_type === 'theoretical' && (
              <div className="ml-9 border border-dashed border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-400 italic">
                Long answer · manually graded
              </div>
            )}
          </div>

          {/* Right: metadata */}
          <div className="shrink-0 w-[160px] flex flex-col gap-2.5 pt-0.5">
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50/50">
              {q.question_type === 'mcq' && <List className="w-4 h-4 text-gray-500" />}
              {q.question_type === 'true_false' && <Check className="w-4 h-4 text-gray-500" />}
              {(q.question_type === 'numerical' || q.question_type === 'theoretical') && <AlignLeft className="w-4 h-4 text-gray-500" />}
              <span className="text-xs text-gray-600 font-medium capitalize">
                {q.question_type === 'true_false' ? 'True / False' : q.question_type === 'mcq' ? 'Multiple Choice' : q.question_type}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 shrink-0">Marks</span>
              <span className="text-sm font-semibold text-green-600">+{q.positive_marks ?? q.marks}</span>
              {(q.negative_marks ?? 0) > 0 && (
                <span className="text-sm font-semibold text-red-500">−{q.negative_marks}</span>
              )}
            </div>
            {q.difficulty && (
              <span className={`text-xs px-2.5 py-1 rounded-lg font-medium border text-center capitalize ${diffColor(q.difficulty)}`}>
                {q.difficulty}
              </span>
            )}
            {q.is_pyq && (
              <span className="text-xs px-2.5 py-1 rounded-lg font-medium border bg-amber-50 text-amber-700 border-amber-200 text-center flex items-center justify-center gap-1">
                <Archive className="w-3 h-3" /> PYQ
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Row Action Menu ────────────────────────────────────────────────────── */

function RowActionMenu({
  onView, onEdit, onDuplicate, onDelete,
}: {
  onView: () => void; onEdit: () => void; onDuplicate: () => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const actions = [
    { icon: Eye, label: 'View Questions', onClick: onView },
    { icon: Edit2, label: 'Edit Exam', onClick: onEdit },
    { icon: Copy, label: 'Duplicate Exam', onClick: onDuplicate },
    { icon: Trash2, label: 'Delete', onClick: onDelete, danger: true },
  ];

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-1 text-sm">
          {actions.map(({ icon: Icon, label, onClick, danger }) => (
            <button key={label}
              onClick={() => { setOpen(false); onClick(); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left
                ${danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'}`}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */

export function QuestionBankPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [examRows, setExamRows] = useState<ExamBankRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingExam, setViewingExam] = useState<ExamBankRow | null>(null);
  const [filterExam, setFilterExam] = useState('all');

  /* Fetch exams + question counts */
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: examsData } = await supabase
      .from('exams')
      .select('*, batches(*)')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });

    if (!examsData || examsData.length === 0) {
      setExamRows([]);
      setLoading(false);
      return;
    }

    const rows: ExamBankRow[] = await Promise.all(
      examsData.map(async (exam) => {
        const { data: questions } = await supabase
          .from('questions')
          .select('*')
          .eq('exam_id', exam.id)
          .order('order_index');
        return {
          ...exam,
          questionCount: questions?.length ?? 0,
          questions: (questions ?? []) as Question[],
        };
      })
    );

    setExamRows(rows);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void fetchData(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [fetchData]);

  /* Filtered rows */
  const filtered = filterExam === 'all'
    ? examRows
    : examRows.filter((e) => e.id === filterExam);

  /* Stats */
  const totalQuestions = examRows.reduce((s, e) => s + e.questionCount, 0);
  const totalExams = examRows.length;
  const publishedExams = examRows.filter((e) => e.is_published).length;
  const draftExams = examRows.filter((e) => !e.is_published).length;

  /* Actions */
  const handleDuplicate = async (exam: ExamBankRow) => {
    if (!user) return;
    const { data: newExam, error: examErr } = await supabase.from('exams').insert({
      teacher_id: user.id,
      batch_id: exam.batch_id,
      batch_ids: exam.batch_ids,
      title: `${exam.title} (Copy)`,
      subject: exam.subject,
      duration_minutes: exam.duration_minutes,
      total_marks: 0,
      scheduled_at: exam.scheduled_at,
      allow_pyq: exam.allow_pyq,
      no_reverse_back: exam.no_reverse_back,
      per_question_time_seconds: exam.per_question_time_seconds,
      negative_marking: false,
      negative_marks_per_wrong: 0,
      is_published: false,
      status: 'draft',
    }).select().single();
    if (examErr || !newExam) { toast.error('Duplicate failed'); return; }

    if (exam.questions.length > 0) {
      await supabase.from('questions').insert(
        exam.questions.map(({ id: _id, ...q }) => ({ ...q, exam_id: newExam.id }))
      );
    }
    toast.success('Exam duplicated!');
    fetchData();
  };

  const handleDelete = async (exam: ExamBankRow) => {
    if (!confirm(`Delete "${exam.title}" and all its questions? This cannot be undone.`)) return;
    await supabase.from('questions').delete().eq('exam_id', exam.id);
    const { error } = await supabase.from('exams').delete().eq('id', exam.id);
    if (error) { toast.error('Delete failed'); return; }
    toast.success('Exam deleted.');
    if (viewingExam?.id === exam.id) setViewingExam(null);
    fetchData();
  };

  const startImportedExam = (questions: ExtractedQuestion[]) => {
    sessionStorage.setItem('x-pert:pending-question-import', JSON.stringify(questions));
    router.push('/teacher/exams?import=questions');
  };

  /* ─── View Questions Panel ─────────────────────────────────────────────── */

  if (viewingExam) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => setViewingExam(null)}
              className="text-sm text-indigo-600 hover:text-indigo-800 mb-2 flex items-center gap-1 font-medium">
              ← Back to Question Bank
            </button>
            <h2 className="text-gray-900 text-2xl font-semibold">{viewingExam.title}</h2>
            <p className="text-gray-500 text-sm mt-1">
              {viewingExam.subject} · {viewingExam.questionCount} questions · {viewingExam.total_marks} marks
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusBadge(viewingExam.status).cls}`}>
              {statusBadge(viewingExam.status).label}
            </span>
          </div>
        </div>

        {/* Question Cards — Figma-style, matching Exam Builder */}
        {viewingExam.questions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Archive className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No questions in this exam.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {viewingExam.questions.map((q, i) => (
              <QuestionViewCard key={q.id} q={q} index={i} />
            ))}
            <div className="text-center text-xs text-gray-400 pt-2">
              {viewingExam.questions.length} question{viewingExam.questions.length !== 1 ? 's' : ''} · {viewingExam.questions.reduce((s, q) => s + (q.positive_marks ?? q.marks), 0)} marks total
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ─── Main View: Exam summary cards ────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h2 className="text-gray-900 text-2xl font-semibold">Question Bank</h2>
          <p className="text-gray-600 text-sm mt-1">Browse exams and their questions — view, edit, duplicate, or delete</p>
        </div>
        <div className="w-full lg:w-auto lg:max-w-xl">
          <QuestionExtractionUpload onExtracted={startImportedExam} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Exams', val: totalExams, color: 'bg-indigo-100 text-indigo-600', Icon: FileText },
          { label: 'Total Questions', val: totalQuestions, color: 'bg-blue-100 text-blue-600', Icon: BookOpen },
          { label: 'Published', val: publishedExams, color: 'bg-green-100 text-green-600', Icon: Check },
          { label: 'Drafts', val: draftExams, color: 'bg-amber-100 text-amber-600', Icon: Edit2 },
        ].map(({ label, val, color, Icon }) => (
          <div key={label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{label}</p>
                <p className="text-2xl text-gray-900 font-semibold">{val}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      {examRows.length > 1 && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-700">Filter by Exam:</label>
          <select value={filterExam} onChange={(e) => setFilterExam(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="all">All Exams</option>
            {examRows.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
          <span className="text-sm text-gray-500">{filtered.length} exam{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Exam list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Archive className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No exams found. Create exams and add questions first.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_140px_100px_110px_110px_100px_60px] gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>Exam Title</span>
            <span>Subject</span>
            <span className="text-center">Questions</span>
            <span>Created</span>
            <span>Updated</span>
            <span className="text-center">Status</span>
            <span className="text-center">Actions</span>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-100">
            {filtered.map((exam) => {
              const badge = statusBadge(exam.status);
              return (
                <div key={exam.id}
                  className="grid grid-cols-[1fr_140px_100px_110px_110px_100px_60px] gap-3 px-5 py-4 items-center hover:bg-gray-50/70 transition-colors group">
                  {/* Title */}
                  <div className="min-w-0">
                    <button onClick={() => setViewingExam(exam)}
                      className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors text-left truncate block w-full">
                      {exam.title}
                    </button>
                  </div>

                  {/* Subject */}
                  <span className="text-sm text-gray-600 truncate">{exam.subject || '—'}</span>

                  {/* Questions count */}
                  <div className="text-center">
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                      <BookOpen className="w-3.5 h-3.5" /> {exam.questionCount}
                    </span>
                  </div>

                  {/* Created */}
                  <span className="text-xs text-gray-500">{formatDate(exam.created_at)}</span>

                  {/* Updated */}
                  <span className="text-xs text-gray-500">{formatDate(exam.created_at)}</span>

                  {/* Status */}
                  <div className="text-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-center">
                    <RowActionMenu
                      onView={() => setViewingExam(exam)}
                      onEdit={() => { window.location.href = `/teacher/exams`; }}
                      onDuplicate={() => handleDuplicate(exam)}
                      onDelete={() => handleDelete(exam)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
