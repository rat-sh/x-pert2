'use client';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseRealtime } from '@/shared/hooks/useSupabaseRealtime';
import { fetchSchedules, addSchedule, updateSchedule, deleteSchedule } from '../services/calendar.service';
import type { Schedule } from '../types/calendar.types';

export function useSchedules() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setSchedules(await fetchSchedules(user.id));
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  useSupabaseRealtime('calendar_schedules', { table: 'calendar_schedules' }, () => void load());

  const add = async (params: Omit<Schedule, 'id' | 'created_at' | 'teacher_id'>) => {
    if (!user) return;
    const s = await addSchedule({ ...params, teacher_id: user.id });
    setSchedules((prev) => [...prev, s].sort((a, b) => a.schedule_date.localeCompare(b.schedule_date)));
    toast.success('Added to calendar');
    return s;
  };

  const update = async (id: string, patch: Partial<Schedule>) => {
    await updateSchedule(id, patch);
    setSchedules((prev) => prev.map((s) => s.id === id ? { ...s, ...patch } : s));
    toast.success('Updated');
  };

  const remove = async (id: string) => {
    await deleteSchedule(id);
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    toast.success('Removed');
  };

  const getSchedulesForDate = (date: string) => schedules.filter((s) => s.schedule_date === date);

  return { schedules, loading, add, update, remove, getSchedulesForDate, refresh: load };
}
