'use client';
import { Copy, Key } from 'lucide-react';
import { toast } from 'sonner';

interface ExamKeyZoneProps {
  examKey: string;
  examPin: string | null | undefined;
}

export function ExamKeyZone({ examKey, examPin }: ExamKeyZoneProps) {
  const copy = (label: string, value: string) => {
    navigator.clipboard.writeText(value).then(() => toast.success(`${label} copied!`));
  };

  return (
    <div className="mx-5 mb-5 rounded-lg bg-gray-50 border border-gray-200 divide-y divide-gray-200 overflow-hidden">
      {[
        { label: 'Exam Key', value: examKey },
        { label: 'PIN', value: examPin ?? '—' },
      ].map(({ label, value }) => (
        <div key={label} className="flex items-center gap-3 px-4 py-2.5">
          <Key className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-xs text-gray-500 w-20 shrink-0">{label}:</span>
          <span className="text-sm font-mono font-semibold text-indigo-700 flex-1">{value}</span>
          <button
            onClick={() => copy(label, value)}
            className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 transition-colors"
            title={`Copy ${label}`}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
