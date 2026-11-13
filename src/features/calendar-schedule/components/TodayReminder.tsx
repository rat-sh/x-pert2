import { Clock, Users, BookOpen, FileText, Pencil, Trash2 } from 'lucide-react';
import { Schedule } from '../types/calendar.types';
import { formatTime, toLocalDateString } from '@/shared/utils/date.utils';

interface TodayReminderProps {
  today: Date;
  todaySchedules: Schedule[];
  loading: boolean;
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: string) => void;
}

export function TodayReminder({
  today,
  todaySchedules,
  loading,
  onEdit,
  onDelete,
}: TodayReminderProps) {
  const todayClasses = todaySchedules.filter((s) => s.type === 'class');
  const todayExams = todaySchedules.filter((s) => s.type === 'exam');
  const todayBatches = [...new Set(todaySchedules.map((s) => s.batch_name))];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center gap-2">
        <Clock className="w-5 h-5 text-white" />
        <h3 className="text-white font-semibold">Today&apos;s Quick Reminder</h3>
        <span className="ml-auto text-indigo-200 text-sm">
          {toLocalDateString(today)}
        </span>
      </div>

      {loading ? (
        <div className="p-6 text-center text-gray-400 text-sm">Loading…</div>
      ) : todaySchedules.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p>No classes or exams scheduled for today</p>
        </div>
      ) : (
        <div className="p-4 sm:p-6 space-y-4">
          {todayBatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-indigo-600" />
                <p className="text-gray-700 text-sm font-medium">Active Batches Today</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {todayBatches.map((b, i) => (
                  <span key={i} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}

          {todayClasses.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-green-600" />
                <p className="text-gray-700 text-sm font-medium">Classes Today</p>
              </div>
              <div className="space-y-2">
                {todayClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg group">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-medium truncate">{cls.subject}</p>
                      <p className="text-gray-600 text-sm truncate">{cls.batch_name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-green-700 text-sm">{formatTime(cls.start_time)}</p>
                      <p className="text-gray-500 text-xs">{cls.duration}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => onEdit(cls)} className="p-1 hover:bg-green-200 rounded text-green-700" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(cls.id)} className="p-1 hover:bg-red-100 rounded text-red-500" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {todayExams.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-red-600" />
                <p className="text-gray-700 text-sm font-medium">Exams Today</p>
              </div>
              <div className="space-y-2">
                {todayExams.map((exam) => (
                  <div key={exam.id} className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg group">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-medium truncate">{exam.subject}</p>
                      <p className="text-gray-600 text-sm truncate">{exam.batch_name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-red-700 text-sm">{formatTime(exam.start_time)}</p>
                      <p className="text-gray-500 text-xs">{exam.duration}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => onEdit(exam)} className="p-1 hover:bg-red-100 rounded text-red-600" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(exam.id)} className="p-1 hover:bg-red-200 rounded text-red-500" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
