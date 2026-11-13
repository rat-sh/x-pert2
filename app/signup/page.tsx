import type { Metadata } from 'next';
import { SignupForm } from '@/features/auth/components/SignupForm';

export const metadata: Metadata = {
  title: 'Create Teacher Account — X-Pert',
  description: 'Register as a teacher on X-Pert and start managing your classes.',
};

export default function SignupPage() {
  return <SignupForm />;
}
