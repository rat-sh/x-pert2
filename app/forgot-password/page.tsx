import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot Password — X-Pert',
  description: 'Reset your X-Pert account password via email.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
