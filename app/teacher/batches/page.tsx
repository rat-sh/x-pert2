import type { Metadata } from 'next';
import { BatchManagerPage } from '@/features/batch-manager/components/BatchManagerPage';

export const metadata: Metadata = {
  title: 'Students & Batches — X-Pert Teacher',
  description: 'Manage your student batches, attendance, and fees.',
};

export default function TeacherBatchesRoute() {
  return <BatchManagerPage />;
}
