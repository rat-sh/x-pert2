'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, Download, Eye, X, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/shared/services/supabase-client';
import { useStudent } from '@/contexts/StudentContext';

interface ResultRow { submission_id: string; exam_id: string; exam_title: string; batch_name: string; total_score: number; total_marks: number; started_at: string; submitted_at: string; percentage: number | null; }
interface ReviewAnswer { question_id: string; question_text: string; question_type: string; correct_answer: string | null; student_answer: string | null; is_correct: boolean | null; marks_awarded: number | null; max_marks: number; }

export function StudentResultsPage() {
  const { student } = useStudent();
  const [submissions, setSubmissions] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ResultRow | null>(null);
  const [answers, setAnswers] = useState<ReviewAnswer[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  const load = useCallback(async () => {
    if (!student) return;
    setLoading(true);
    const { data, error } = await supabase.from('student_result_view').select('*').order('submitted_at', { ascending: false });
    if (error) toast.error('Could not load your results.');
    setSubmissions((data ?? []).map((row) => ({ ...row, batch_name: 'Batch' })) as ResultRow[]);
    // Batch names come from the RLS-visible exam relation and do not need a privileged RPC.
    const examIds = [...new Set((data ?? []).map((row) => row.exam_id))];
    if (examIds.length) {
      const { data: exams } = await supabase.from('exams').select('id, batches(name)').in('id', examIds);
      const names = new Map((exams ?? []).map((exam) => [exam.id, (Array.isArray(exam.batches) ? exam.batches[0] : exam.batches)?.name ?? 'Batch']));
      setSubmissions((data ?? []).map((row) => ({ ...row, batch_name: names.get(row.exam_id) ?? 'Batch' })) as ResultRow[]);
    }
    setLoading(false);
  }, [student]);
  useEffect(() => {
    const timeout = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const showReview = async (result: ResultRow) => {
    setSelected(result); setReviewLoading(true); setAnswers([]);
    const { data, error } = await supabase.from('student_answer_review_view').select('*').eq('submission_id', result.submission_id);
    if (error) toast.error('Could not load answer review.'); else setAnswers((data ?? []) as ReviewAnswer[]);
    setReviewLoading(false);
  };
  const timeTaken = (result: ResultRow) => { const seconds = (new Date(result.submitted_at).getTime() - new Date(result.started_at).getTime()) / 1000; return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`; };
  const passed = (result: ResultRow) => (result.percentage ?? (result.total_marks ? result.total_score / result.total_marks * 100 : 0)) >= 40;
  const download = (result: ResultRow, details: ReviewAnswer[]) => {
    const doc = new jsPDF(); const isPassed = passed(result);
    doc.setFontSize(18); doc.text('Exam Result Report', 14, 20); doc.setFontSize(11);
    doc.text(`Exam: ${result.exam_title}`, 14, 32); doc.text(`Submitted: ${new Date(result.submitted_at).toLocaleString()}`, 14, 40);
    doc.text(`Score: ${result.total_score} / ${result.total_marks}`, 14, 48); doc.text(`Result: ${isPassed ? 'Passed' : 'Failed'}`, 14, 56); doc.text(`Time taken: ${timeTaken(result)}`, 14, 64);
    autoTable(doc, { startY: 72, head: [['#', 'Question', 'Your answer', 'Correct answer', 'Result', 'Marks']], body: details.map((answer, index) => [index + 1, answer.question_text, answer.student_answer || '—', answer.correct_answer || '—', answer.is_correct === true ? 'Correct' : answer.is_correct === false ? 'Incorrect' : 'Pending', `${answer.marks_awarded ?? 0}/${answer.max_marks}`]), styles: { fontSize: 8 }, headStyles: { fillColor: [79, 70, 229] } });
    doc.save(`result_${result.exam_title.replace(/[^a-z0-9]+/gi, '_')}.pdf`); toast.success('Result downloaded.');
  };
  return <div className="space-y-6"><h2 className="text-gray-900 text-xl font-semibold">My Results</h2>{loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div> : submissions.length === 0 ? <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-500">No results yet. Complete an exam to see your results here.</div> : <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr>{['Exam', 'Batch', 'Score', 'Status', 'Submitted', ''].map((head) => <th key={head} className="px-5 py-3 text-left text-xs text-gray-500 uppercase">{head}</th>)}</tr></thead><tbody className="divide-y divide-gray-200">{submissions.map((result) => <tr key={result.submission_id}><td className="px-5 py-4 text-sm font-medium">{result.exam_title}</td><td className="px-5 py-4 text-sm text-gray-600">{result.batch_name}</td><td className="px-5 py-4 text-sm">{result.total_score}/{result.total_marks}</td><td className="px-5 py-4 text-sm">{passed(result) ? <span className="text-green-700"><CheckCircle className="inline w-4 h-4 mr-1" />Passed</span> : <span className="text-red-700"><XCircle className="inline w-4 h-4 mr-1" />Failed</span>}</td><td className="px-5 py-4 text-sm text-gray-500">{new Date(result.submitted_at).toLocaleString()}</td><td className="px-5 py-4"><button onClick={() => void showReview(result)} className="text-indigo-600 hover:text-indigo-800"><Eye className="w-4 h-4" /></button></td></tr>)}</tbody></table></div>}{selected && <div className="fixed inset-0 bg-black/40 z-50 grid place-items-center p-4"><div className="bg-white max-w-4xl max-h-[90vh] overflow-auto rounded-xl w-full p-6"><div className="flex justify-between gap-4"><div><h3 className="font-semibold text-lg">{selected.exam_title}</h3><p className="text-sm text-gray-500">{selected.total_score}/{selected.total_marks} · {passed(selected) ? 'Passed' : 'Failed'}</p></div><button onClick={() => setSelected(null)}><X className="w-5 h-5" /></button></div><div className="flex justify-end mt-4"><button onClick={() => download(selected, answers)} disabled={reviewLoading} className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"><Download className="w-4 h-4" />Download Result</button></div>{reviewLoading ? <div className="py-12 text-center text-gray-500">Loading review…</div> : <div className="mt-4 space-y-3">{answers.map((answer, index) => <div key={answer.question_id} className="border rounded-lg p-4 text-sm"><p className="font-medium">{index + 1}. {answer.question_text}</p><div className="grid sm:grid-cols-3 gap-2 mt-3 text-gray-600"><p>Your answer: <b>{answer.student_answer || '—'}</b></p><p>Correct: <b>{answer.correct_answer || '—'}</b></p><p className={answer.is_correct ? 'text-green-700' : answer.is_correct === false ? 'text-red-700' : ''}>{answer.is_correct === null ? 'Pending manual grading' : answer.is_correct ? 'Correct' : 'Incorrect'} · {answer.marks_awarded ?? 0}/{answer.max_marks}</p></div></div>)}</div>}</div></div>}</div>;
}
