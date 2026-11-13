'use client';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { fetchBatches, createBatch, deleteBatch } from '../services/batch-manager.service';
import { generateJoinCode } from '../utils/batch.utils';
import type { BatchFormValues } from '../schemas/batch.schema';

export function useBatches() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Awaited<ReturnType<typeof fetchBatches>>>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setBatches(await fetchBatches(user.id));
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const create = async (values: BatchFormValues) => {
    if (!user) return;
    const joinCode = generateJoinCode();
    await createBatch({ teacherId: user.id, ...values, joinCode });
    toast.success(`Batch "${values.name}" created`);
    void load();
  };

  const remove = async (id: string, name: string) => {
    await deleteBatch(id);
    toast.success(`Batch "${name}" deleted`);
    void load();
  };

  return { batches, loading, create, remove, refresh: load };
}
