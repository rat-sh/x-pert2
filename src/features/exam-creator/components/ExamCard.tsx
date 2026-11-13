import { BookOpen, Clock, Calendar, Users, Key, Copy } from 'lucide-react';
import { ExamRow, ExamStatus } from '../types/exam-creator.types';
import { statusBadge } from '../utils/exam-creator.utils';
import { ExamActionMenu } from './ExamActionMenu';
import { supabase } from '@/shared/services/supabase-client';
import { generateKey, generatePin } from '../utils/exam-creator.utils';
import { toast } from 'sonner';

interface ExamCardProps {
  exam: ExamRow;
  onEdit: () => void;
  onSettings: () => void;
  onPreview: () => void;
  onDuplicate: () => void;
  onRegenKey: () => void;
  onViewResults: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}

export function ExamCard({
  exam,
  onEdit,
  onSettings,
  onPreview,
  onDuplicate,
  onRegenKey,
  onViewResults,
  onArchive,
  onDelete,
  onRefresh,
}: ExamCardProps) {
  const badge = statusBadge(exam.status as ExamStatus);
  const batchNames = (() => {
    if (exam.batches) return exam.batches.name;
    return `${exam.batch_ids?.length ?? 1} batch${(exam.batch_ids?.length ?? 1) !== 1 ? 'es' : ''}`;
  })();

  const handleGenerateKeyInline = async () => {
    const { data: qs } = await supabase.from('questions').select('positive_marks, marks').eq('exam_id', exam.id);
    const totalMarks = (qs ?? []).reduce((s: number, q: { positive_marks?: number; marks?: number }) => s + (q.positive_marks ?? q.marks ?? 1), 0);
    const key = generateKey();
    const pin = generatePin();
    const { error } = await supabase.from('exams').update({
      exam_key: key,
      exam_pin: pin,
      status: 'scheduled',
      is_published: true,
      total_marks: totalMarks,
    }).eq('id', exam.id);

    if (error) {
      toast.error('Failed: ' + error.message);
      return;
    }
    toast.success(`Key generated: ${key} · PIN: ${pin}`);
    onRefresh();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5 pb-3">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className="font-semibold text-gray-900 text-base">{exam.title}</h3>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${badge.className}`}>{badge.label}</span>
              {exam.is_instant && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-green-100 text-green-700 border border-green-200">Instant</span>
              )}
              {exam.allow_pyq && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 border border-amber-200">PYQ</span>
              )}
              {exam.hasAttempts && (
                <span className="text-xs px-2 py-0.5 rounded font-medium bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Attempts
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />{exam.subject}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{exam.duration_minutes} mins</span>
              {exam.scheduled_at && (
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date(exam.scheduled_at).toLocaleString()}</span>
              )}
              <span className="text-gray-700 font-medium">{exam.questionCount} Questions · {exam.total_marks} marks</span>
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{batchNames}</span>
            </div>
          </div>
          <ExamActionMenu
            exam={exam}
            hasAttempts={exam.hasAttempts ?? false}
            onEdit={onEdit}
            onSettings={onSettings}
            onPreview={onPreview}
            onDuplicate={onDuplicate}
            onRegenKey={onRegenKey}
            onViewResults={onViewResults}
            onArchive={onArchive}
            onDelete={onDelete}
          />
        </div>
      </div>

      {exam.exam_key ? (
        <div className="mx-5 mb-5 rounded-lg bg-gray-50 border border-gray-200 divide-y divide-gray-200 overflow-hidden">
          {[
            { label: 'Exam Key', value: exam.exam_key, icon: Key },
            { label: 'PIN', value: exam.exam_pin ?? '—', icon: Key },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-2.5">
              <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-500 w-20 shrink-0">{label}:</span>
              <span className="text-sm font-mono font-semibold text-indigo-700 flex-1">{value}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(value); toast.success(`${label} copied!`); }}
                className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 transition-colors"
                title={`Copy ${label}`}
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mx-5 mb-5">
          <button
            onClick={handleGenerateKeyInline}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 border border-dashed border-indigo-300 rounded-lg px-4 py-2 hover:bg-indigo-50 transition-colors w-full justify-center"
          >
            <Key className="w-4 h-4" /> Generate Key & PIN
          </button>
        </div>
      )}
    </div>
  );
}
