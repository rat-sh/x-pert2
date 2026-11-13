import { useState, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Batch } from '@/shared/types/database.types';
import { useClickOutside } from '@/shared/hooks/useClickOutside';

interface BatchSelectorProps {
  batches: Batch[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function BatchSelector({ batches, selected, onChange }: BatchSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setOpen(false));

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  const selectedBatches = batches.filter((b) => selected.includes(b.id));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-gray-400 transition-colors"
      >
        <span className="flex-1 text-left truncate">
          {selectedBatches.length === 0
            ? <span className="text-gray-400">Select batches…</span>
            : selectedBatches.map((b) => b.name).join(', ')}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 ml-2 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {selectedBatches.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedBatches.map((b) => (
            <span key={b.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
              {b.name}
              <button type="button" onClick={() => toggle(b.id)} className="hover:text-indigo-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg py-1 max-h-48 overflow-y-auto">
          {batches.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-500">
              No batches. <a href="/teacher/batches" className="underline text-indigo-600">Create one first.</a>
            </p>
          ) : (
            batches.map((b) => (
              <label key={b.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(b.id)}
                  onChange={() => toggle(b.id)}
                  className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-900">{b.name}</span>
                {b.subject && <span className="text-xs text-gray-400 ml-auto">{b.subject}</span>}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}
