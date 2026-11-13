import { RotateCcw } from 'lucide-react';
import { generateKey, generatePin } from '../utils/exam-creator.utils';
import { supabase } from '@/shared/services/supabase-client';
import { toast } from 'sonner';
import { ExamRow } from '../types/exam-creator.types';

interface RegenKeyModalProps {
  exam: ExamRow;
  onSuccess: () => void;
  onClose: () => void;
}

export function RegenKeyModal({ exam, onSuccess, onClose }: RegenKeyModalProps) {
  const handleRegen = async () => {
    const key = generateKey();
    const pin = generatePin();
    const { error } = await supabase.from('exams').update({ exam_key: key, exam_pin: pin }).eq('id', exam.id);
    if (error) {
      toast.error('Failed to regenerate key');
      return;
    }
    toast.success(`New Key: ${key} · PIN: ${pin}`);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <RotateCcw className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Regenerate Key & PIN?</h3>
            <p className="text-xs text-gray-500">Old key will no longer work</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-6">Students who had the old key will need the new one. This cannot be undone.</p>
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleRegen} className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600">
            Regenerate
          </button>
        </div>
      </div>
    </div>
  );
}
