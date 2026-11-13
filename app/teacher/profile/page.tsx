import type { Metadata } from 'next';
import { TeacherProfilePage } from '@/features/teacher-profile/components/TeacherProfilePage';

export const metadata: Metadata = {
  title: 'Profile — X-Pert Teacher',
  description: 'Manage your teacher account details.',
};

export default function TeacherProfileRoute() {
  return <TeacherProfilePage />;
}
