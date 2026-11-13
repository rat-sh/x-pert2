import type { Metadata } from 'next';
import { StudentResultsPage } from '@/features/student-results/components/StudentResultsPage';

export const metadata: Metadata = {
  title: 'My Results — X-Pert',
  description: 'View your exam scores and performance history.',
};

export default function StudentResultsRoute() {
  return <StudentResultsPage />;
}
