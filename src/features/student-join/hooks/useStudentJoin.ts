'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/shared/services/supabase-client';
import { signUpStudent } from '../services/student-join.service';

export function useStudentJoin() {
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const createStudent = async (params: {
    fullName: string; email: string; phone?: string; password: string; batchCode: string;
  }) => {
    setCreating(true);
    const result = await signUpStudent(params);
    setCreating(false);
    if (result.error) { toast.error(result.error.message ?? 'Signup failed'); return false; }
    toast.success('Account created! Welcome to X-Pert.');
    return true;
  };

  const joinBatch = async (studentId: string, batchCode: string) => {
    setJoining(true);
    const { error } = await supabase.rpc('join_batch_by_code', { p_student_id: studentId, p_code: batchCode });
    setJoining(false);
    if (error) { toast.error(error.message ?? 'Invalid code'); return false; }
    toast.success('Joined batch!');
    return true;
  };

  return { creating, joining, createStudent, joinBatch };
}
