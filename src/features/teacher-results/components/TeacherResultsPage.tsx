'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, Download, Eye, X, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/shared/services/supabase-client';
import { useAuth } from '@/contexts/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ExamSubmission, SubmissionAnswer } from '@/shared/types/database.types';

export function TeacherResultsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExam, setSelectedExam] = useState('all');
  const [selectedResult, setSelectedResult] = useState<ExamSubmission | null>(null);
  const [exams, setExams] = useState<{ id: string; title: string }[]>([]);

  const fetchResults = useCallback(async () => {
    if (!user) return;
      // get all exams belonging to this teacher
      const { data: examData } = await supabase
        .from('exams')
        .select('id, title')
        .eq('teacher_id', user.id);

      setExams(examData ?? []);
      const examIds = (examData ?? []).map((e) => e.id);
      if (examIds.length === 0) { setSubmissions([]); setLoading(false); return; }

      const { data: submissionsData } = await supabase
        .from('exam_submissions')
        .select(`
          *,
          exams(*, batches(*)),
          submission_answers(*, questions(*))
        `)
        .in('exam_id', examIds)
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false });

      if (submissionsData && submissionsData.length > 0) {
        const studentIds = Array.from(new Set(submissionsData.map((s) => s.student_id)));
        const { data: usersData } = await supabase.from('users').select('id, full_name, email').in('id', studentIds);
        const userMap = new Map((usersData ?? []).map((u) => [u.id, u]));

        const enriched = submissionsData.map((s) => {
          const userObj = userMap.get(s.student_id);
          return {
            ...s,
            users: {
              full_name: userObj?.full_name ?? 'Student',
              email: userObj?.email ?? null,
            },
          };
        });

        setSubmissions(enriched as ExamSubmission[]);
      } else {
        setSubmissions([]);
      }
      setLoading(false);
  }, [user]);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => { void fetchResults(); }, 0);
    const interval = window.setInterval(() => { void fetchResults(); }, 15_000);
    return () => { window.clearTimeout(initialFetch); window.clearInterval(interval); };
  }, [fetchResults]);

  const filtered = submissions.filter((s) => {
    const name = (s.users as unknown as { full_name: string })?.full_name ?? '';
    const title = s.exams?.title ?? '';
    const matchSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchExam = selectedExam === 'all' || s.exam_id === selectedExam;
    return matchSearch && matchExam;
  });

  const avgScore = filtered.length
    ? filtered.reduce((sum, s) => {
      const pct = s.exams?.total_marks ? ((s.total_score ?? 0) / s.exams.total_marks) * 100 : 0;
      return sum + pct;
    }, 0) / filtered.length
    : 0;

  const passRate = filtered.length
    ? (filtered.filter((s) => {
      const pct = s.exams?.total_marks ? ((s.total_score ?? 0) / s.exams.total_marks) * 100 : 0;
      return pct >= 40;
    }).length / filtered.length) * 100
    : 0;

  const timeTaken = (s: ExamSubmission) => {
    if (!s.started_at || !s.submitted_at) return 'N/A';
    const diff = (new Date(s.submitted_at).getTime() - new Date(s.started_at).getTime()) / 60000;
    return `${Math.floor(diff)}m ${Math.round((diff % 1) * 60)}s`;
  };

  const downloadPDF = (s: ExamSubmission) => {
    const doc = new jsPDF();
    const name = (s.users as unknown as { full_name: string })?.full_name ?? 'Student';
    const batchName = (s.exams as unknown as { batches: { name: string } })?.batches?.name ?? 'N/A';

    doc.setFontSize(18);
    doc.text('Exam Result Report', 14, 20);
    doc.setFontSize(11);
    doc.text(`Student: ${name}`, 14, 32);
    doc.text(`Exam: ${s.exams?.title ?? ''}`, 14, 40);
    doc.text(`Batch: ${batchName}`, 14, 48);
    doc.text(`Score: ${s.total_score ?? 0} / ${s.exams?.total_marks ?? 0}`, 14, 56);
    doc.text(`Time Taken: ${timeTaken(s)}`, 14, 64);
    doc.text(`Submitted: ${s.submitted_at ? new Date(s.submitted_at).toLocaleString() : 'N/A'}`, 14, 72);

    if (s.submission_answers && s.submission_answers.length > 0) {
      autoTable(doc, {
        startY: 80,
        head: [['#', 'Question', 'Your Answer', 'Correct Answer', 'Marks']],
        body: s.submission_answers.map((a: SubmissionAnswer, i: number) => [
          i + 1,
          a.questions?.question_text?.slice(0, 60) + (a.questions?.question_text && a.questions.question_text.length > 60 ? '…' : ''),
          a.student_answer ?? '—',
          a.questions?.correct_answer ?? '—',
          a.is_correct ? `+${a.marks_awarded}` : '0',
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [79, 70, 229] },
      });
    }

    doc.save(`result_${name.replace(/\s+/g, '_')}_${s.exams?.title?.replace(/\s+/g, '_') ?? ''}.pdf`);
    toast.success('PDF downloaded!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-gray-900 text-xl font-semibold">Student Results</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Submissions', val: filtered.length },
          { label: 'Average Score', val: `${avgScore.toFixed(1)}%` },
          { label: 'Pass Rate (≥40%)', val: `${passRate.toFixed(1)}%` },
        ].map(({ label, val }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600 mb-2 text-sm">{label}</p>
            <p className="text-2xl font-semibold text-gray-900">{val}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search student or exam…" value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
          <select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white">
            <option value="all">All Exams</option>
            {exams.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">No results found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Student Name', 'Exam', 'Batch', 'Score', 'Status', 'Submitted', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((s) => {
                  const pct = s.exams?.total_marks ? Math.round(((s.total_score ?? 0) / s.exams.total_marks) * 100) : 0;
                  const passed = pct >= 40;
                  const name = (s.users as unknown as { full_name: string })?.full_name ?? 'Student';
                  const batchName = (s.exams as unknown as { batches?: { name: string } })?.batches?.name ?? '—';
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{s.exams?.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{batchName}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {s.total_score ?? 0}/{s.exams?.total_marks ?? 0}
                        <span className="ml-1 text-xs text-gray-500">({pct}%)</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {passed ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {passed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setSelectedResult(s)} className="text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-50">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => downloadPDF(s)} className="text-gray-500 hover:text-gray-800 p-1 rounded hover:bg-gray-100">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-semibold text-gray-900 text-lg">Result Preview</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => downloadPDF(selectedResult)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
                  <Download className="w-4 h-4" /> PDF
                </button>
                <button onClick={() => setSelectedResult(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                {[
                  { label: 'Student', val: (selectedResult.users as unknown as { full_name: string })?.full_name },
                  { label: 'Exam', val: selectedResult.exams?.title },
                  { label: 'Batch', val: (selectedResult.exams as unknown as { batches?: { name: string } })?.batches?.name ?? '—' },
                  { label: 'Score', val: `${selectedResult.total_score ?? 0} / ${selectedResult.exams?.total_marks ?? 0}` },
                  { label: 'Time Taken', val: timeTaken(selectedResult) },
                  { label: 'Submitted', val: selectedResult.submitted_at ? new Date(selectedResult.submitted_at).toLocaleString() : 'N/A' },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{val}</p>
                  </div>
                ))}
              </div>

              {/* Question-wise breakdown */}
              {selectedResult.submission_answers && selectedResult.submission_answers.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Question-wise Breakdown</h4>
                  <div className="space-y-3">
                    {selectedResult.submission_answers.map((a: SubmissionAnswer, i: number) => (
                      <div key={a.id} className={`p-4 rounded-lg border ${a.is_correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Q{i + 1}</p>
                            <p className="text-sm text-gray-900">{a.questions?.question_text}</p>
                          </div>
                          <span className={`shrink-0 text-xs font-bold ${a.is_correct ? 'text-green-700' : 'text-red-700'}`}>
                            {a.is_correct ? `+${a.marks_awarded}` : '0'}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-gray-500">Student Answer: </span>
                            <span className="font-medium text-gray-900">{a.student_answer ?? '—'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Correct Answer: </span>
                            <span className="font-medium text-green-700">{a.questions?.correct_answer ?? '—'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
