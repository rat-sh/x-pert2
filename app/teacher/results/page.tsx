import type { Metadata } from 'next';
import { TeacherResultsPage } from '@/features/teacher-results/components/TeacherResultsPage';

export const metadata: Metadata = {
  title: 'Results — X-Pert Teacher',
  description: 'View student exam results and performance analytics.',
};

export default function TeacherResultsRoute() {
  return <TeacherResultsPage />;
}
