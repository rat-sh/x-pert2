'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { SignupSchema, type SignupInput } from '@/features/auth/schemas/auth.schema';
import { signUp } from '@/features/auth/services/auth.service';

type FieldErrors = Partial<Record<keyof SignupInput, string>>;

/**
 * SignupForm
 *
 * Teacher registration form.
 * Validates with Zod, calls auth service, redirects on success.
 */
export function SignupForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<SignupInput>({
    full_name: '',
    phone: '',
    email: '',
    password: '',
    subject: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleChange = (field: keyof SignupInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const result = SignupSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof SignupInput;
        if (field) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const { data: authData, error } = await signUp(formData);
    setLoading(false);

    if (error) {
      toast.error(error.message ?? 'Signup failed. Please try again.');
      return;
    }

    if (!authData?.session) {
      // Email confirmation required
      toast.success('Teacher account created! Please confirm your email, then sign in.');
      router.push('/login');
      return;
    }

    toast.success('Teacher account created! Redirecting…');
    router.push('/teacher');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <GraduationCap className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-indigo-900 mb-2">Teacher Sign Up</h1>
          <p className="text-gray-600">Create your teacher account on X-Pert</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-4" noValidate>
          {/* Full Name */}
          <div>
            <label htmlFor="signup-name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="signup-name"
              type="text"
              value={formData.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              placeholder="Your full name"
              autoComplete="name"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-colors ${
                errors.full_name ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name}</p>}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="signup-phone" className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="signup-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+91 9876543210"
              autoComplete="tel"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="signup-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-colors ${
                errors.email ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="signup-subject" className="block text-sm font-medium text-gray-700 mb-1.5">
              Subject <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="signup-subject"
              type="text"
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              placeholder="e.g., Physics"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1.5">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPass ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                minLength={6}
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-colors ${
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
            id="signup-submit-btn"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium text-sm mt-2 transition-colors"
          >
            {loading ? 'Creating account…' : 'Create Teacher Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 font-medium hover:text-indigo-700">
            Sign in
          </Link>
        </p>
        <p className="text-center text-sm text-gray-500 mt-3">
          Student?{' '}
          <Link href="/student/join" className="text-green-600 font-medium hover:text-green-700">
            Create a student account
          </Link>
        </p>
      </div>
    </div>
  );
}
