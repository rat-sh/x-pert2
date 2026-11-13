import type { Metadata } from 'next';
import { MaterialsBrowserPage } from '@/features/study-materials/components/student/MaterialsBrowserPage';

export const metadata: Metadata = {
  title: 'Study Materials — X-Pert',
  description: 'Browse study materials shared by your teachers.',
};

export default function StudentMaterialsRoute() {
  return <MaterialsBrowserPage />;
}
