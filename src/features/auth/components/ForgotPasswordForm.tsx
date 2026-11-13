'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { ForgotPasswordSchema } from '@/features/auth/schemas/auth.schema';
import { resetPassword } from '@/features/auth/services/auth.service';

/**
 * ForgotPasswordForm  [NEW]
 *
 * Sends a Supabase password-reset email.
 * Shows a success state after sending so users know to check their inbox.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validate = (): boolean => {
    const result = ForgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setEmailError(result.error.issues[0]?.message ?? 'Invalid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);

    if (error) {
      toast.error(error.message ?? 'Something went wrong. Please try again.');
      return;
    }

    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {sent ? (
          /* Success state */
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Check your inbox</h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              We&apos;ve sent a password reset link to{' '}
              <span className="font-medium text-gray-900">{email}</span>.
              <br />
              Click the link in the email to set a new password.
            </p>
            <p className="text-xs text-gray-400">
              Didn&apos;t receive it? Check your spam folder or{' '}
              <button
                type="button"
                onClick={() => setSent(false)}
                className="text-indigo-600 hover:underline font-medium"
              >
                try again
              </button>
              .
            </p>
            <Link
              href="/login"
              className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        ) : (
          /* Form state */
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <Mail className="w-8 h-8 text-indigo-600" />
              </div>
              <h1 className="text-2xl font-bold text-indigo-900 mb-2">Forgot your password?</h1>
              <p className="text-gray-600 text-sm leading-relaxed">
                Enter the email address you registered with and we&apos;ll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-colors ${
                    emailError ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
              </div>

              <button
                type="submit"
                id="forgot-password-submit-btn"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                {loading ? 'Sending reset link…' : 'Send Reset Link'}
              </button>
            </form>

            <Link
              href="/login"
              className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
