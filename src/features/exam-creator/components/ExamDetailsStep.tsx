import { Play } from 'lucide-react';
import { Batch } from '@/shared/types/database.types';
import { ExamDetails } from '../types/exam-creator.types';
import { BatchSelector } from './BatchSelector';

interface ExamDetailsStepProps {
  details: ExamDetails;
  setDetails: React.Dispatch<React.SetStateAction<ExamDetails>>;
  batches: Batch[];
}

export function ExamDetailsStep({ details, setDetails, batches }: ExamDetailsStepProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <h3 className="text-gray-900 font-semibold text-base">Exam Details</h3>
        <p className="text-gray-500 text-sm mt-0.5">Set up the basic information for this exam</p>
      </div>
      <div className="p-6 space-y-5">
        {/* Title + Subject */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Exam Title <span className="text-red-500">*</span></label>
            <input type="text" value={details.title}
              onChange={(e) => setDetails((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g., Physics Mid-Term Test"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject <span className="text-red-500">*</span></label>
            <input type="text" value={details.subject}
              onChange={(e) => setDetails((p) => ({ ...p, subject: e.target.value }))}
              placeholder="e.g., Physics"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {/* Batch + Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Batches <span className="text-red-500">*</span></label>
            <BatchSelector batches={batches} selected={details.batch_ids}
              onChange={(ids) => setDetails((p) => ({ ...p, batch_ids: ids }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (minutes)</label>
            <input type="number" min={5} max={300} value={details.duration_minutes}
              onChange={(e) => setDetails((p) => ({ ...p, duration_minutes: parseInt(e.target.value) || 60 }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {/* Instant vs Scheduled */}
        <div className="space-y-3">
          <label className="flex items-center justify-between p-4 rounded-xl border-2 border-green-200 bg-green-50 cursor-pointer hover:bg-green-100/80 transition-colors">
            <div>
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Play className="w-4 h-4 text-green-600" /> Instant Exam
              </p>
              <p className="text-xs text-gray-600 mt-0.5">Skip schedule — students can join immediately for 60 minutes after you publish</p>
            </div>
            <button type="button"
              onClick={() => setDetails((p) => ({ ...p, is_instant: !p.is_instant }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${details.is_instant ? 'bg-green-600' : 'bg-gray-300'}`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${details.is_instant ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </label>
        </div>

        {/* Date + Time (Optional per 4.2 architectural rules) */}
        {!details.is_instant && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Scheduled Date <span className="text-gray-400 font-normal">(Optional)</span></label>
              <input type="date" value={details.scheduled_date}
                onChange={(e) => setDetails((p) => ({ ...p, scheduled_date: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Scheduled Time <span className="text-gray-400 font-normal">(Optional)</span></label>
              <input type="time" value={details.scheduled_time}
                onChange={(e) => setDetails((p) => ({ ...p, scheduled_time: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        )}

        {/* Exam Rules */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Exam Rules</h4>
          <div className="space-y-2">
            <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">Allow PYQ Practice</p>
                <p className="text-xs text-gray-500">Students can practice in PYQ section</p>
              </div>
              <button
                type="button"
                onClick={() => setDetails((p) => ({ ...p, allow_pyq: !p.allow_pyq }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${details.allow_pyq ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${details.allow_pyq ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">No Reverse Back</p>
                <p className="text-xs text-gray-500">Students cannot return to a previous question</p>
              </div>
              <button
                type="button"
                onClick={() => setDetails((p) => ({ ...p, no_reverse_back: !p.no_reverse_back }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${details.no_reverse_back ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${details.no_reverse_back ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">Per Question Timer</p>
                <p className="text-xs text-gray-500">Auto-advance to next question on timeout</p>
              </div>
              <button
                type="button"
                onClick={() => setDetails((p) => ({ ...p, per_question_time_enabled: !p.per_question_time_enabled }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${details.per_question_time_enabled ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${details.per_question_time_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </label>

            {details.per_question_time_enabled && (
              <div className="flex items-center gap-3 px-3 py-2.5 bg-indigo-50 border border-indigo-200 rounded-lg ml-3">
                <label className="text-sm text-gray-700 whitespace-nowrap font-medium">Seconds per question:</label>
                <input type="number" min={10} max={600} value={details.per_question_time_seconds}
                  onChange={(e) => setDetails((p) => ({ ...p, per_question_time_seconds: parseInt(e.target.value) || 60 }))}
                  className="w-24 px-2 py-1.5 border border-indigo-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-400 font-semibold" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
