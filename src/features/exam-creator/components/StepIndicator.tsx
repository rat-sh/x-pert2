import { Check } from 'lucide-react';
import { Step } from '../types/exam-creator.types';

export function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { id: 'details', label: 'Exam Details' },
    { id: 'questions', label: 'Add Questions' },
  ];
  const current = steps.findIndex((s) => s.id === step);
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
              ${i < current ? 'bg-indigo-600 text-white' : i === current ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {i < current ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-sm font-medium ${i === current ? 'text-gray-900' : i < current ? 'text-indigo-600' : 'text-gray-400'}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-16 h-0.5 mx-3 ${i < current ? 'bg-indigo-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}
