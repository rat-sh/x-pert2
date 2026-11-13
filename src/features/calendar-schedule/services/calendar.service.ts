import { supabase } from '@/shared/services/supabase-client';
import { Schedule, ScheduleFormData } from '../types/calendar.types';

export async function fetchSchedules(userId: string): Promise<Schedule[]> {
  const { data, error } = await supabase
    .from('calendar_schedules')
    .select('*')
    .eq('teacher_id', userId)
    .order('schedule_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw error;
  return (data as Schedule[]) ?? [];
}

export async function fetchCalendarSchedules(userId: string): Promise<Schedule[]> {
  return fetchSchedules(userId);
}

export async function addSchedule(form: ScheduleFormData & { teacher_id?: string }): Promise<Schedule> {
  const { data, error } = await supabase.from('calendar_schedules').insert({
    teacher_id: form.teacher_id,
    batch_name: form.batch_name,
    subject: form.subject,
    schedule_date: form.schedule_date,
    start_time: form.start_time,
    duration: form.duration || '1 hour',
    type: form.type,
  }).select().single();

  if (error || !data) throw error ?? new Error('Failed to create schedule');
  return data as Schedule;
}

export async function createScheduleService(userId: string, form: ScheduleFormData): Promise<void> {
  await addSchedule({ ...form, teacher_id: userId });
}

export async function updateSchedule(editingId: string, form: Partial<ScheduleFormData>): Promise<void> {
  const { error } = await supabase
    .from('calendar_schedules')
    .update(form)
    .eq('id', editingId);

  if (error) throw error;
}

export async function updateScheduleService(editingId: string, form: ScheduleFormData): Promise<void> {
  await updateSchedule(editingId, form);
}

export async function deleteSchedule(id: string): Promise<void> {
  const { error } = await supabase
    .from('calendar_schedules')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function deleteScheduleService(id: string): Promise<void> {
  await deleteSchedule(id);
}
