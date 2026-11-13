import { AlertTriangle } from 'lucide-react';
import { ExamRow } from '../types/exam-creator.types';

interface ExamDeleteConfirmModalProps {
  exam: ExamRow;
  onConfirm: () => void;
  onClose: () => void;
}

export function ExamDeleteConfirmModal({ exam, onConfirm, onClose }: ExamDeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Delete Exam?</h3>
            <p className="text-xs text-gray-500">This cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-1">
          You are about to permanently delete <span className="font-semibold text-gray-900">&quot;{exam.title}&quot;</span> and all its questions.
        </p>
        {exam.hasAttempts && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            ⚠ Students have already attempted this exam. Their submission data will remain but the exam will be removed.
          </p>
        )}
        <div className="flex gap-2 mt-6">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
