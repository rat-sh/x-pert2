'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function useAuthRedirect(destination?: string) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (destination) { router.replace(destination); return; }
    if (profile?.role === 'teacher') router.replace('/teacher');
    else if (profile?.role === 'student') router.replace('/student');
    else router.replace('/');
  }, [user, profile, loading, router, destination]);
}
