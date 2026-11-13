import { X } from 'lucide-react';
import { ModalMode, ScheduleFormData } from '../types/calendar.types';

interface ScheduleFormModalProps {
  modalMode: ModalMode;
  form: ScheduleFormData;
  saving: boolean;
  setForm: React.Dispatch<React.SetStateAction<ScheduleFormData>>;
  onSave: () => Promise<void>;
  onClose: () => void;
}

export function ScheduleFormModal({
  modalMode,
  form,
  saving,
  setForm,
  onSave,
  onClose,
}: ScheduleFormModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-900 font-semibold">
            {modalMode === 'add' ? 'Add Schedule' : 'Edit Schedule'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1 font-medium">Type</label>
            <div className="flex gap-2">
              {(['class', 'exam'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, type: t }))}
                  className={`flex-1 py-2 rounded-lg border-2 capitalize text-sm font-medium transition-colors ${
                    form.type === t
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                      : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1 font-medium">Batch Name</label>
            <input
              type="text"
              value={form.batch_name}
              onChange={(e) => setForm((prev) => ({ ...prev, batch_name: e.target.value }))}
              placeholder="e.g., Batch A - Physics"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1 font-medium">Subject / Title</label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
              placeholder="e.g., Quantum Mechanics"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1 font-medium">Time</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1 font-medium">Duration</label>
              <input
                type="text"
                value={form.duration}
                onChange={(e) => setForm((prev) => ({ ...prev, duration: e.target.value }))}
                placeholder="e.g., 2 hours"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1 font-medium">Date</label>
            <input
              type="date"
              value={form.schedule_date}
              onChange={(e) => setForm((prev) => ({ ...prev, schedule_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={onSave}
            disabled={saving}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {saving ? 'Saving…' : modalMode === 'add' ? 'Add Schedule' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
