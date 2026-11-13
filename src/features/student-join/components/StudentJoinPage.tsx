'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useStudent } from '@/contexts/StudentContext';
import { Spinner } from '@/shared/components/ui/Spinner';
import { signUpStudent } from '@/features/student-join/services/student-join.service';

/**
 * StudentJoinPage
 *
 * Two states:
 * 1. Already authenticated student → show "Join another batch" form
 * 2. Unauthenticated  → show full student signup form
 */
export function StudentJoinPage() {
  const router = useRouter();
  const { student, loading, joinBatch } = useStudent();

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', code: '',
  });
  const [saving, setSaving] = useState(false);

  const setField = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ─── Create account flow ────────────────────────────────────────────────────

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    const { data, error } = await signUpStudent({
      fullName: form.fullName,
      email: form.email,
      password: form.password,
    });
    setSaving(false);
    if (error || !data?.user) {
      toast.error(error?.message ?? 'Could not create student account.');
      return;
    }
    if (!data.session) {
      toast.success('Check your email to confirm your account, then sign in.');
    } else {
      toast.success('Account created. You can now join your batch.');
    }
  };

  // ─── Join batch flow ────────────────────────────────────────────────────────

  const handleJoinBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) return;
    setSaving(true);
    const joined = await joinBatch(form.code);
    setSaving(false);
    if (!joined) {
      toast.error('Could not join this batch. Check the code and try again.');
      return;
    }
    toast.success(`Joined ${joined.batchName}`);
    router.replace('/student');
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Already logged in — just join another batch
  if (student) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white rounded-2xl border border-gray-200 p-7 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Join another batch</h1>
        <p className="text-sm text-gray-500 mt-1">Enter the join code from your teacher.</p>
        <form onSubmit={handleJoinBatch} className="mt-6 space-y-4">
          <input
            value={form.code}
            onChange={(e) => setField('code', e.target.value.toUpperCase())}
            placeholder="BATCH CODE"
            required
            className="w-full p-3 border border-gray-300 rounded-lg font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-lg bg-indigo-600 text-white font-medium disabled:opacity-50 transition-colors hover:bg-indigo-700"
          >
            {saving ? 'Joining…' : 'Join batch'}
          </button>
        </form>
      </div>
    );
  }

  // New student — create account
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 grid place-items-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-7">
          <div className="mx-auto w-14 h-14 rounded-full bg-indigo-100 grid place-items-center">
            <BookOpen className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Student account</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create an account to join batches and keep your results.
          </p>
        </div>

        {/* Signup form */}
        <form onSubmit={handleCreateAccount} className="space-y-4" noValidate>
          <div>
            <label htmlFor="student-name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              id="student-name"
              required
              value={form.fullName}
              onChange={(e) => setField('fullName', e.target.value)}
              placeholder="Your full name"
              autoComplete="name"
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="student-email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              id="student-email"
              required
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="student-password" className="block text-sm font-medium text-gray-700 mb-1.5">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="student-password"
              required
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            id="student-create-account-btn"
            disabled={saving}
            className="w-full py-3 rounded-lg bg-indigo-600 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            {saving ? 'Creating…' : 'Create student account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 font-medium hover:text-indigo-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
