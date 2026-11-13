'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';
import { supabase } from '@/shared/services/supabase-client';
import type { UserProfile } from '@/shared/types/database.types';
import { useAuth } from '@/contexts/AuthContext';

interface StudentContextType {
  student: UserProfile | null;
  loading: boolean;
  joinBatch: (joinCode: string) => Promise<{ batchId: string; batchName: string; teacherName: string } | null>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const StudentContext = createContext<StudentContextType>({
  student: null,
  loading: true,
  joinBatch: async () => null,
  signOut: async () => {},
  refresh: async () => {},
});

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();

  const joinBatch = useCallback(async (joinCode: string) => {
    if (!user || profile?.role !== 'student') return null;

    const { data, error } = await supabase.rpc('join_batch_by_code', {
      p_join_code: joinCode.trim(),
    });

    if (error || !data?.[0]) return null;

    const row = data[0] as {
      out_batch_id: string;
      out_batch_name: string;
      out_teacher_name: string;
    };

    return {
      batchId: row.out_batch_id,
      batchName: row.out_batch_name,
      teacherName: row.out_teacher_name,
    };
  }, [profile?.role, user]);

  const value = useMemo(() => ({
    student: profile?.role === 'student' ? profile : null,
    loading,
    joinBatch,
    signOut,
    refresh: async () => {},
  }), [joinBatch, loading, profile, signOut]);

  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>;
}

export const useStudent = () => useContext(StudentContext);
