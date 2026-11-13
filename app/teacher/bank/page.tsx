import type { Metadata } from 'next';
import { QuestionBankPage } from '@/features/question-bank/components/QuestionBankPage';

export const metadata: Metadata = {
  title: 'Question Bank — X-Pert Teacher',
  description: 'Manage your stored question papers.',
};

export default function TeacherBankRoute() {
  return <QuestionBankPage />;
}
