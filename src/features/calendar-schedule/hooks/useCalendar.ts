'use client';
import { useState } from 'react';

export function useCalendar() {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday   = () => setCurrentDate(new Date());

  return { currentDate, year, month, daysInMonth, firstWeekday, prevMonth, nextMonth, goToday };
}
