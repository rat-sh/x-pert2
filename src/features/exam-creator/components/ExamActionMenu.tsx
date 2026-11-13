import { useState, useRef } from 'react';
import { Edit2, Settings, Eye, Copy, Key, BookOpen, Archive, Trash2, MoreVertical } from 'lucide-react';
import { ExamRow } from '../types/exam-creator.types';
import { useClickOutside } from '@/shared/hooks/useClickOutside';

interface ExamActionMenuProps {
  exam: ExamRow;
  hasAttempts: boolean;
  onEdit: () => void;
  onSettings: () => void;
  onPreview: () => void;
  onDuplicate: () => void;
  onRegenKey: () => void;
  onViewResults: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function ExamActionMenu({
  exam,
  onEdit,
  onSettings,
  onPreview,
  onDuplicate,
  onRegenKey,
  onViewResults,
  onArchive,
  onDelete,
}: ExamActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setOpen(false));

  const actions = [
    { icon: Edit2, label: 'Edit', onClick: onEdit },
    { icon: Settings, label: 'Update Settings', onClick: onSettings },
    { icon: Eye, label: 'Preview', onClick: onPreview },
    { icon: Copy, label: 'Duplicate', onClick: onDuplicate },
    { icon: Key, label: exam.exam_key ? 'Regenerate Key & PIN' : 'Generate Key & PIN', onClick: onRegenKey },
    { icon: BookOpen, label: 'View Results', onClick: onViewResults },
    { icon: Archive, label: exam.status === 'archived' ? 'Unarchive' : 'Archive', onClick: onArchive },
    { icon: Trash2, label: 'Delete', onClick: onDelete, danger: true },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        title="More actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 w-52 bg-white border border-gray-200 rounded-xl shadow-xl py-1 text-sm">
          {actions.map(({ icon: Icon, label, onClick, danger }) => (
            <button
              key={label}
              onClick={() => { setOpen(false); onClick(); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left
                ${danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
