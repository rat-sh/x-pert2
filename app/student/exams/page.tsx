import type { Metadata } from 'next';
import { StudentExamsPage } from '@/features/student-exams/components/StudentExamsPage';

export const metadata: Metadata = {
  title: 'My Exams — X-Pert',
  description: 'Take exams from your enrolled batches.',
};

export default function StudentExamsRoute() {
  return <StudentExamsPage />;
}
