import type { Metadata } from 'next';
import { UpcomingExamsPage } from '@/features/upcoming-exams/components/UpcomingExamsPage';

export const metadata: Metadata = {
  title: 'Upcoming Exams — X-Pert Teacher',
  description: 'View all upcoming scheduled exams.',
};

export default function TeacherUpcomingRoute() {
  return <UpcomingExamsPage />;
}
