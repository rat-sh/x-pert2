'use client';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { fetchStudents, removeStudentFromBatch } from '../services/batch-manager.service';
import { BatchStudent } from '../types/batch.types';

export function useBatchStudents() {
  const [students, setStudents] = useState<BatchStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);

  const load = useCallback(async (id: string) => {
    setBatchId(id);
    setLoading(true);
    setStudents(await fetchStudents(id));
    setLoading(false);
  }, []);

  const remove = async (studentId: string, bId?: string) => {
    await removeStudentFromBatch(studentId, bId ?? batchId ?? undefined);
    setStudents((prev) => prev.filter((s) => s.student_id !== studentId));
    toast.success('Student removed');
  };

  return { students, loading, batchId, load, remove };
}
