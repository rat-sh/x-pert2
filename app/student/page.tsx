'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ClipboardCheck, FileText, BookOpen, Clock, Calendar, CheckCircle } from 'lucide-react';
import { useStudent } from '@/contexts/StudentContext';
import { BatchStatusControl } from '@/features/batch-status/components/BatchStatusControl';
import { useBatchStatus } from '@/features/batch-status/hooks/useBatchStatus';
import { useStudentExams } from '@/features/student-exams/hooks/useStudentExams';
import { Spinner } from '@/shared/components/ui/Spinner';

const QUICK_LINKS = [
  {
    label: 'My Exams',
    href: '/student/exams',
    icon: ClipboardCheck,
    color: 'bg-green-100 text-green-600',
    desc: 'Take exams from your batches',
  },
  {
    label: 'My Results',
    href: '/student/results',
    icon: FileText,
    color: 'bg-blue-100 text-blue-600',
    desc: 'View your performance',
  },
  {
    label: 'Study Materials',
    href: '/student/materials',
    icon: BookOpen,
    color: 'bg-purple-100 text-purple-600',
    desc: 'Notes, videos & practice sheets',
  },
];

export default function StudentHomePage() {
  const { student } = useStudent();
  const { batches, loading: batchesLoading } = useBatchStatus();
  const { exams, loading: examsLoading } = useStudentExams();
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');

  const firstName = student?.full_name?.split(' ')[0] ?? 'Student';

  // Filter exams by selected batch if filtered
  const filteredExams = selectedBatchId === 'all'
    ? exams
    : exams.filter((e) => e.batch_id === selectedBatchId || e.batch_ids?.includes(selectedBatchId));

  // Group exams by batch for batch-wise breakdown
  const examsByBatch = batches.map((b) => {
    const batchExams = exams.filter((e) => e.batch_id === b.id || e.batch_ids?.includes(b.id));
    return {
      batch: b,
      exams: batchExams,
    };
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Hello, {firstName} 👋
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Your exams, batches, and schedules — all organized in one place.
          </p>
        </div>
        <BatchStatusControl />
      </div>

      {/* Quick Action Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.label}
              href={link.href}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${link.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {link.label}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{link.desc}</p>
            </Link>
          );
        })}
      </div>

      {/* Enrolled Batches Overview & Activity Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Batch-wise Activity &amp; Exams</h3>
          {batches.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Filter Batch:</span>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Joined Batches ({batches.length})</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {batchesLoading || examsLoading ? (
          <div className="flex justify-center py-12 bg-white rounded-xl border border-gray-200">
            <Spinner />
          </div>
        ) : batches.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <BookOpen className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
            <h4 className="text-gray-900 font-semibold text-base mb-1">No Batches Joined Yet</h4>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Use the batch dropdown button at the top right to enter a batch join code from your teacher.
            </p>
          </div>
        ) : selectedBatchId === 'all' ? (
          <div className="space-y-6">
            {examsByBatch.map(({ batch, exams: bExams }) => {
              const pendingExams = bExams.filter((e) => !e.submission);

              return (
                <div key={batch.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-base">{batch.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Teacher: <span className="font-medium text-gray-700">{batch.teacherName}</span>
                        {batch.subject ? ` · Subject: ${batch.subject}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                        {bExams.length} Total Exams
                      </span>
                      {pendingExams.length > 0 && (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                          {pendingExams.length} Pending
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    {bExams.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No exams scheduled for this batch yet.</p>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {bExams.map((exam) => (
                          <div key={exam.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900 text-sm truncate">{exam.title}</span>
                                {exam.is_instant && (
                                  <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold">Instant</span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{exam.duration_minutes} mins</span>
                                <span className="font-medium text-gray-700">{exam.total_marks} Marks</span>
                                {exam.scheduled_at && (
                                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(exam.scheduled_at).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>

                            {exam.submission ? (
                              <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0">
                                <CheckCircle className="w-4 h-4" /> Score: {exam.submission.score}
                              </div>
                            ) : (
                              <Link
                                href="/student/exams"
                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors shrink-0"
                              >
                                Take Exam
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Filtered Batch View */
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h4 className="font-semibold text-gray-900">
              Exams for {batches.find((b) => b.id === selectedBatchId)?.name}
            </h4>
            {filteredExams.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No exams found for this batch.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredExams.map((exam) => (
                  <div key={exam.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{exam.title}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{exam.duration_minutes} mins</span>
                        <span className="font-medium text-gray-700">{exam.total_marks} Marks</span>
                      </div>
                    </div>
                    {exam.submission ? (
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                        Score: {exam.submission.score}
                      </span>
                    ) : (
                      <Link
                        href="/student/exams"
                        className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors"
                      >
                        Take Exam
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
