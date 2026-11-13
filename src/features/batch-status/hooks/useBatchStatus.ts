'use client';

import { useCallback, useEffect, useState } from 'react';
import { useStudent } from '@/contexts/StudentContext';
import { fetchStudentBatches, leaveStudentBatch, type JoinedBatch } from '@/features/batch-status/services/batch-status.service';
import { toast } from 'sonner';

interface UseBatchStatusReturn {
  batches: JoinedBatch[];
  loading: boolean;
  reload: () => Promise<void>;
  leaveBatch: (batchId: string, batchName: string) => Promise<boolean>;
}

export function useBatchStatus(): UseBatchStatusReturn {
  const { student } = useStudent();
  const [batches, setBatches] = useState<JoinedBatch[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!student) return;
    setLoading(true);
    const data = await fetchStudentBatches(student.id);
    setBatches(data);
    setLoading(false);
  }, [student]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const leaveBatch = async (batchId: string, batchName: string): Promise<boolean> => {
    if (!student) return false;
    const ok = await leaveStudentBatch(student.id, batchId);
    if (ok) {
      toast.success(`Left batch "${batchName}"`);
      await reload();
      return true;
    } else {
      toast.error(`Failed to leave batch "${batchName}"`);
      return false;
    }
  };

  return { batches, loading, reload, leaveBatch };
}
