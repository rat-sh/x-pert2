'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { LoginSchema } from '@/features/auth/schemas/auth.schema';
import { signIn, fetchProfile } from '@/features/auth/services/auth.service';
import { ResetPasswordModal } from '@/features/auth/components/ResetPasswordModal';
import { supabase } from '@/shared/services/supabase-client';

/**
 * LoginForm
 *
 * Self-contained teacher login form.
 * Validates with Zod, calls auth service, redirects by role.
 * Handles password reset flow via modal popup.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showResetModal, setShowResetModal] = useState(searchParams.get('reset') === 'true');
  const isResetModalOpen = searchParams.get('reset') === 'true' || showResetModal;

  const handleContinueToDashboard = async () => {
    setShowResetModal(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await fetchProfile(user.id);
      router.push(profile?.role === 'teacher' ? '/teacher' : '/student');
    } else {
      router.push('/login');
    }
  };

  const validate = () => {
    const result = LoginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as 'email' | 'password';
        if (field) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const { data, error } = await signIn(email, password);
    setLoading(false);

    if (error || !data?.user) {
      toast.error(error?.message ?? 'Login failed. Please try again.');
      return;
    }

    const { data: profile } = await fetchProfile(data.user.id);
    router.push(profile?.role === 'teacher' ? '/teacher' : '/student');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <BookOpen className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-indigo-900 mb-2">Welcome back</h1>
          <p className="text-gray-600">Sign in to your X-Pert account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5" noValidate>
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 bg-white transition-colors ${
                errors.email ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 bg-white transition-colors ${
                  errors.password ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-indigo-600 font-medium hover:text-indigo-700">
            Create teacher account
          </Link>
        </p>
        <p className="text-center text-sm text-gray-500 mt-3">
          Student?{' '}
          <Link href="/student/join" className="text-green-600 font-medium hover:text-green-700">
            Create an account
          </Link>
        </p>
      </div>

      <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setShowResetModal(false)}
        onContinue={handleContinueToDashboard}
      />
    </div>
  );
}
