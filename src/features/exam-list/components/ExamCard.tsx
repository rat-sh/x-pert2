'use client';
import {
  BookOpen, Clock, Calendar, Users, Key, Plus,
  MoreVertical, Edit2, Eye, Copy, Archive, RotateCcw, Trash2, BarChart2,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/shared/services/supabase-client';
import { statusBadge, generateKey, generatePin } from '@/features/exam-creator/utils/exam-creator.utils';
import { ExamKeyZone } from './ExamKeyZone';
import type { ExamRow } from '@/features/exam-creator/types/exam-creator.types';
import { useClickOutside } from '@/shared/hooks/useClickOutside';

interface ExamCardProps {
  exam: ExamRow;
  onEdit: () => void;
  onSettings: () => void;
  onPreview: () => void;
  onDuplicate: () => void;
  onRegenKey: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}

export function ExamCard({
  exam, onEdit, onSettings, onPreview, onDuplicate,
  onRegenKey, onArchive, onDelete, onRefresh,
}: ExamCardProps) {
  const badge = statusBadge(exam.status);
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setMenuOpen(false));

  const batchNames = exam.batches?.name
    ?? `${exam.batch_ids?.length ?? 1} batch${(exam.batch_ids?.length ?? 1) !== 1 ? 'es' : ''}`;

  const handleQuickKey = async () => {
    const { data: qs } = await supabase.from('questions').select('positive_marks, marks').eq('exam_id', exam.id);
    const totalMarks = (qs ?? []).reduce((s: number, q: { positive_marks?: number; marks?: number }) => s + (q.positive_marks ?? q.marks ?? 1), 0);
    const key = generateKey();
    const pin = generatePin();
    const { error } = await supabase.from('exams').update({
      exam_key: key, exam_pin: pin,
      status: 'scheduled', is_published: true, total_marks: totalMarks,
    }).eq('id', exam.id);
    if (error) { toast.error('Failed: ' + error.message); return; }
    toast.success(`Key: ${key} · PIN: ${pin}`);
    onRefresh();
  };

  const menuItems = [
    { label: 'Edit Questions', icon: Edit2, action: onEdit },
    { label: 'Settings', icon: MoreVertical, action: onSettings },
    { label: 'Preview', icon: Eye, action: onPreview },
    { label: 'Duplicate', icon: Copy, action: onDuplicate },
    { label: 'View Results', icon: BarChart2, action: () => router.push(`/teacher/results?exam=${exam.id}`) },
    { label: 'Regen Key', icon: RotateCcw, action: onRegenKey, disabled: !exam.exam_key },
    { label: exam.status === 'archived' ? 'Restore' : 'Archive', icon: Archive, action: onArchive },
    { label: 'Delete', icon: Trash2, action: onDelete, danger: true },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Top row */}
      <div className="p-5 pb-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className="font-semibold text-gray-900 text-base">{exam.title}</h3>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${badge.className}`}>{badge.label}</span>
              {exam.is_instant && <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-green-100 text-green-700 border border-green-200">Instant</span>}
              {exam.allow_pyq && <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 border border-amber-200">PYQ</span>}
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
              <span className="text-gray-700 font-medium">{exam.questionCount} Qs · {exam.total_marks} marks</span>
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{batchNames}</span>
            </div>
          </div>
          {/* Action menu */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Exam actions"
            >
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-20">
                {menuItems.map(({ label, icon: Icon, action, danger, disabled }) => (
                  <button
                    key={label}
                    onClick={() => { setMenuOpen(false); if (!disabled) action(); }}
                    disabled={disabled}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors
                      ${disabled ? 'opacity-40 cursor-not-allowed text-gray-500' : danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key zone */}
      {exam.exam_key ? (
        <ExamKeyZone examKey={exam.exam_key} examPin={exam.exam_pin} />
      ) : (
        <div className="mx-5 mb-5">
          <button
            onClick={handleQuickKey}
            className="w-full flex items-center justify-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 border border-dashed border-indigo-300 rounded-lg px-4 py-2 hover:bg-indigo-50 transition-colors"
          >
            <Key className="w-4 h-4" /> Generate Key & PIN
          </button>
        </div>
      )}
    </div>
  );
}
