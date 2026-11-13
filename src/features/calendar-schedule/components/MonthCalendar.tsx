import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Schedule } from '../types/calendar.types';
import { formatTime } from '@/shared/utils/date.utils';

interface MonthCalendarProps {
  currentDate: Date;
  schedules: Schedule[];
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onSelectSchedule: (schedule: Schedule) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function MonthCalendar({
  currentDate,
  schedules,
  onPreviousMonth,
  onNextMonth,
  onSelectSchedule,
}: MonthCalendarProps) {
  const [todayStr] = useState(() => new Date().toISOString().slice(0, 10));

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const getSchedulesForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return schedules.filter((s) => s.schedule_date === dateStr);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-gray-900 font-semibold">
          {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <div className="flex gap-2">
          <button onClick={onPreviousMonth} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button onClick={onNextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-gray-600 py-2 text-xs sm:text-sm">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}

        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const daySchedules = getSchedulesForDay(day);
          const isToday = dateStr === todayStr;

          return (
            <div
              key={day}
              className={`aspect-square border rounded-lg p-1 sm:p-2 ${
                isToday ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-200'
              }`}
            >
              <div className={`text-center mb-1 text-xs sm:text-sm font-medium ${isToday ? 'text-indigo-600' : 'text-gray-900'}`}>
                {day}
              </div>
              {daySchedules.length > 0 && (
                <div className="space-y-0.5">
                  {daySchedules.slice(0, 2).map((s) => (
                    <div
                      key={s.id}
                      className={`text-xs px-1 py-0.5 rounded truncate hidden sm:block cursor-pointer ${
                        s.type === 'exam' ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'
                      }`}
                      title={`${s.batch_name} - ${formatTime(s.start_time)}`}
                      onClick={() => onSelectSchedule(s)}
                    >
                      {s.subject.length > 8 ? s.subject.substring(0, 8) + '...' : s.subject}
                    </div>
                  ))}
                  <div
                    className={`w-1.5 h-1.5 rounded-full mx-auto sm:hidden ${
                      daySchedules.some((s) => s.type === 'exam') ? 'bg-red-500' : 'bg-indigo-500'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
