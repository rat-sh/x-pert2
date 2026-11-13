import type { Metadata } from 'next';
import { CalendarPage } from '@/features/calendar-schedule/components/CalendarPage';

export const metadata: Metadata = {
  title: 'Calendar — X-Pert Teacher',
  description: 'Schedule and view your classes and exams.',
};

export default function TeacherCalendarRoute() {
  return <CalendarPage />;
}
