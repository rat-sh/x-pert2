import { Users, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Batch } from '../types/batch.types';

interface BatchGridProps {
  batches: Batch[];
  onDeleteBatch: (batchId: string, batchName: string) => void;
  onOpenCreate: () => void;
}

export function BatchGrid({ batches, onDeleteBatch, onOpenCreate }: BatchGridProps) {
  if (batches.length === 0) {
    return (
      <div className="text-center py-14 bg-white rounded-xl border border-gray-200">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-indigo-600" />
        </div>
        <h3 className="text-gray-900 font-semibold text-lg mb-1">No batches yet</h3>
        <p className="text-gray-500 text-sm mb-6">Create your first batch to start adding students</p>
        <button
          onClick={onOpenCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          Create Batch
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {batches.map((batch) => (
        <div key={batch.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 font-medium truncate">{batch.name}</p>
              <p className="text-gray-500 text-xs mt-0.5">
                {batch.subject && <span className="mr-2">{batch.subject}</span>}
                {batch.studentCount} student{batch.studentCount !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => onDeleteBatch(batch.id, batch.name)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete batch"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm font-mono truncate">
              {batch.join_code}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(batch.join_code);
                toast.success('Join code copied!');
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Copy join code"
            >
              <Copy className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
