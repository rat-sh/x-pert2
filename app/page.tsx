'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, GraduationCap, UserCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStudent } from '@/contexts/StudentContext';
import { Spinner } from '@/shared/components/ui/Spinner';

/**
 * Landing page — role-gate.
 *
 * - Authenticated teacher  → redirect /teacher
 * - Authenticated student  → redirect /student
 * - Not authenticated      → show role-selection cards
 */
export default function Home() {
  const { user, profile, loading: authLoading } = useAuth();
  const { student, loading: studentLoading } = useStudent();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || studentLoading) return;
    if (user && profile?.role === 'teacher') {
      router.replace('/teacher');
    } else if (student) {
      router.replace('/student');
    }
  }, [user, profile, student, authLoading, studentLoading, router]);

  if (authLoading || studentLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-indigo-600 animate-pulse" />
          </div>
          <Spinner size="md" />
          <p className="text-gray-600 text-sm">Loading X-Pert…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <BookOpen className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-indigo-900 mb-2">X-Pert</h1>
          <p className="text-gray-600">Smart exam platform for teachers and students</p>
        </div>

        {/* Role cards */}
        <div className="space-y-3">
          <Link
            href="/login"
            className="flex items-center gap-4 p-5 border-2 border-indigo-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">I&apos;m a Teacher</p>
              <p className="text-sm text-gray-500">Sign in with email and password</p>
            </div>
          </Link>

          <Link
            href="/student/join"
            className="flex items-center gap-4 p-5 border-2 border-green-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <UserCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">I&apos;m a Student</p>
              <p className="text-sm text-gray-500">Enter your name and batch join code</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
