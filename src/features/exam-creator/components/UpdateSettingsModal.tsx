import { useState } from 'react';
import { X } from 'lucide-react';
import { Batch } from '@/shared/types/database.types';
import { ExamDetails, ExamRow } from '../types/exam-creator.types';
import { BatchSelector } from './BatchSelector';

interface UpdateSettingsModalProps {
  exam: ExamRow;
  batches: Batch[];
  onSave: (updates: Partial<ExamDetails>) => Promise<void>;
  onClose: () => void;
}

export function UpdateSettingsModal({
  exam,
  batches,
  onSave,
  onClose,
}: UpdateSettingsModalProps) {
  const scheduled = exam.scheduled_at ? new Date(exam.scheduled_at) : null;
  const [form, setForm] = useState({
    title: exam.title,
    subject: exam.subject ?? '',
    batch_ids: exam.batch_ids ?? (exam.batch_id ? [exam.batch_id] : []),
    duration_minutes: exam.duration_minutes,
    scheduled_date: scheduled ? scheduled.toISOString().slice(0, 10) : '',
    scheduled_time: scheduled ? scheduled.toTimeString().slice(0, 5) : '',
    allow_pyq: exam.allow_pyq ?? false,
    no_reverse_back: exam.no_reverse_back ?? false,
    per_question_time_enabled: !!(exam.per_question_time_seconds),
    per_question_time_seconds: exam.per_question_time_seconds ?? 60,
  });
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-semibold text-gray-900">Update Exam Settings</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
            <input value={form.subject} onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Batches</label>
            <BatchSelector batches={batches} selected={form.batch_ids} onChange={(ids) => setForm(p => ({ ...p, batch_ids: ids }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (min)</label>
              <input type="number" min={5} max={300} value={form.duration_minutes}
                onChange={(e) => setForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 60 }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <input type="date" value={form.scheduled_date}
                onChange={(e) => setForm(p => ({ ...p, scheduled_date: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Time</label>
            <input type="time" value={form.scheduled_time}
              onChange={(e) => setForm(p => ({ ...p, scheduled_time: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="space-y-3 pt-1">
            {[
              { key: 'allow_pyq', label: 'Allow PYQ Practice', desc: 'Students can practice in PYQ section' },
              { key: 'no_reverse_back', label: 'No Reverse Back', desc: 'Students cannot return to previous questions' },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
                <button type="button" onClick={() => setForm(p => ({ ...p, [key]: !(p as Record<string, unknown>)[key] }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${(form as Record<string, unknown>)[key] ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${(form as Record<string, unknown>)[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </label>
            ))}
            <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">Per Question Timer</p>
                <p className="text-xs text-gray-500">Auto-advance on timeout</p>
              </div>
              <button type="button" onClick={() => setForm(p => ({ ...p, per_question_time_enabled: !p.per_question_time_enabled }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.per_question_time_enabled ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.per_question_time_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </label>
            {form.per_question_time_enabled && (
              <div className="flex items-center gap-3 px-3 py-2.5 bg-indigo-50 border border-indigo-200 rounded-lg">
                <label className="text-sm text-gray-700 whitespace-nowrap font-medium">Seconds per question:</label>
                <input type="number" min={10} max={600} value={form.per_question_time_seconds}
                  onChange={(e) => setForm(p => ({ ...p, per_question_time_seconds: parseInt(e.target.value) || 60 }))}
                  className="w-24 px-2 py-1.5 border border-indigo-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button
            disabled={saving}
            onClick={async () => { setSaving(true); await onSave(form as unknown as Partial<ExamDetails>); setSaving(false); }}
            className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
