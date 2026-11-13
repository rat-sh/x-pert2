import type { Metadata } from 'next';
import { MaterialsManagerPage } from '@/features/study-materials/components/teacher/MaterialsManagerPage';

export const metadata: Metadata = {
  title: 'Study Materials — X-Pert Teacher',
  description: 'Organise notes, videos and PDFs for your students.',
};

export default function TeacherMaterialsRoute() {
  return <MaterialsManagerPage />;
}
