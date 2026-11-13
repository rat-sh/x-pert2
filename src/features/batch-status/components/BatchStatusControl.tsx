'use client';

import { useRef, useState } from 'react';
import { BookOpen, Plus, Users, X, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useStudent } from '@/contexts/StudentContext';
import { useClickOutside } from '@/shared/hooks/useClickOutside';
import { useBatchStatus } from '@/features/batch-status/hooks/useBatchStatus';

/**
 * BatchStatusControl
 *
 * Dropdown widget showing student's enrolled batches with an option to leave/opt-out.
 * Allows joining a new batch inline via batch code.
 */
export function BatchStatusControl() {
  const { joinBatch } = useStudent();
  const { batches, reload, leaveBatch } = useBatchStatus();
  const [open, setOpen]     = useState(false);
  const [adding, setAdding] = useState(false);
  const [code, setCode]     = useState('');
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null!);

  useClickOutside(ref, () => setOpen(false));

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSaving(true);
    const joined = await joinBatch(code);
    setSaving(false);
    if (!joined) {
      toast.error('Could not join this batch. Check the code and try again.');
      return;
    }
    toast.success(`Joined ${joined.batchName}`);
    setCode('');
    setAdding(false);
    await reload();
  };

  const handleLeave = async (batchId: string, batchName: string) => {
    if (!confirm(`Are you sure you want to leave ${batchName}?`)) return;
    await leaveBatch(batchId, batchName);
  };

  const primaryBatch = batches[0];

  return (
    <div className="relative shrink-0" ref={ref}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Batch status"
        aria-expanded={open}
        className={`flex items-center gap-2 h-10 transition-colors ${
          primaryBatch
            ? 'rounded-full bg-indigo-50 border border-indigo-200 pl-3 pr-4 text-indigo-800 hover:bg-indigo-100'
            : 'w-10 justify-center rounded-full bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <BookOpen className="w-4 h-4" />
        {primaryBatch && (
          <span className="max-w-[10rem] truncate text-sm font-medium">
            {primaryBatch.name}
            {batches.length > 1 ? ` +${batches.length - 1}` : ''}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-xl z-30 p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Your batches</p>
              <p className="text-xs text-gray-500">Classes available to your account</p>
            </div>
            <button
              type="button"
              className="p-1 text-gray-400 hover:text-gray-700"
              onClick={() => setOpen(false)}
              aria-label="Close batch panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Batch list */}
          {batches.length === 0 ? (
            <div className="rounded-lg bg-gray-50 text-center py-5 text-sm text-gray-500">
              No batch joined yet.
            </div>
          ) : (
            <div className="space-y-2">
              {batches.map((batch) => (
                <div key={batch.id} className="rounded-lg border border-gray-100 p-3 flex items-center justify-between group hover:border-gray-200 transition-colors">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{batch.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <Users className="inline w-3 h-3 mr-1" />
                      {batch.teacherName}
                      {batch.subject ? ` · ${batch.subject}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLeave(batch.id, batch.name)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Leave batch"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Join form / button */}
          {adding ? (
            <form onSubmit={handleJoin} className="mt-3 space-y-2">
              <input
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter batch code"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="flex-1 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 text-sm rounded-lg bg-indigo-600 text-white disabled:opacity-50"
                >
                  {saving ? 'Joining…' : 'Join'}
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="w-full mt-3 py-2.5 rounded-lg border border-dashed border-indigo-300 text-sm text-indigo-700 hover:bg-indigo-50 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add another batch
            </button>
          )}
        </div>
      )}
    </div>
  );
}
