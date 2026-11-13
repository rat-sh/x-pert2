import { Calendar as CalendarIcon, Clock, BookOpen, FileText, Pencil, Trash2 } from 'lucide-react';
import { Schedule } from '../types/calendar.types';
import { formatTime, toLocalDateString } from '@/shared/utils/date.utils';

interface TomorrowReminderProps {
  tomorrow: Date;
  tomorrowSchedules: Schedule[];
  loading: boolean;
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: string) => void;
}

export function TomorrowReminder({
  tomorrow,
  tomorrowSchedules,
  loading,
  onEdit,
  onDelete,
}: TomorrowReminderProps) {
  const tomorrowClasses = tomorrowSchedules.filter((s) => s.type === 'class');
  const tomorrowExams = tomorrowSchedules.filter((s) => s.type === 'exam');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center gap-2">
        <CalendarIcon className="w-5 h-5 text-white" />
        <h3 className="text-white font-semibold">Tomorrow&apos;s Tasks &amp; Classes</h3>
        <span className="ml-auto text-blue-100 text-sm">
          {toLocalDateString(tomorrow)}
        </span>
      </div>

      {loading ? (
        <div className="p-6 text-center text-gray-400 text-sm">Loading…</div>
      ) : tomorrowSchedules.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p>No classes or tasks scheduled for tomorrow</p>
        </div>
      ) : (
        <div className="p-4 sm:p-6 space-y-4">
          {tomorrowClasses.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <p className="text-gray-700 text-sm font-medium">Tomorrow&apos;s Classes</p>
              </div>
              <div className="space-y-2">
                {tomorrowClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg group">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-medium truncate">{cls.subject}</p>
                      <p className="text-gray-600 text-sm truncate">{cls.batch_name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-blue-700 text-sm">{formatTime(cls.start_time)}</p>
                      <p className="text-gray-500 text-xs">{cls.duration}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => onEdit(cls)} className="p-1 hover:bg-blue-200 rounded text-blue-700" title="Edit"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => onDelete(cls.id)} className="p-1 hover:bg-red-100 rounded text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tomorrowExams.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-purple-600" />
                <p className="text-gray-700 text-sm font-medium">Tomorrow&apos;s Exams</p>
              </div>
              <div className="space-y-2">
                {tomorrowExams.map((exam) => (
                  <div key={exam.id} className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg group">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-medium truncate">{exam.subject}</p>
                      <p className="text-gray-600 text-sm truncate">{exam.batch_name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-purple-700 text-sm">{formatTime(exam.start_time)}</p>
                      <p className="text-gray-500 text-xs">{exam.duration}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => onEdit(exam)} className="p-1 hover:bg-purple-200 rounded text-purple-700" title="Edit"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => onDelete(exam.id)} className="p-1 hover:bg-red-100 rounded text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
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
