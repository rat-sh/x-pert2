'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Schedule, ModalMode, ScheduleFormData } from '../types/calendar.types';
import {
  fetchCalendarSchedules,
  createScheduleService,
  updateScheduleService,
  deleteScheduleService,
} from '../services/calendar.service';
import { useSupabaseRealtime } from '@/shared/hooks/useSupabaseRealtime';

import { MonthCalendar } from './MonthCalendar';
import { TodayReminder } from './TodayReminder';
import { TomorrowReminder } from './TomorrowReminder';
import { ScheduleFormModal } from './ScheduleFormModal';

const BLANK_FORM: ScheduleFormData = {
  batch_name: '',
  subject: '',
  schedule_date: '',
  start_time: '',
  duration: '',
  type: 'class',
};

export function CalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleFormData>({ ...BLANK_FORM });
  const [saving, setSaving] = useState(false);
  const [todayDate] = useState(() => new Date());
  const [todayStr] = useState(() => new Date().toISOString().slice(0, 10));
  const [tomorrowDate] = useState(() => {
    const tm = new Date();
    tm.setDate(tm.getDate() + 1);
    return tm;
  });
  const [tomorrowStr] = useState(() => {
    const tm = new Date();
    tm.setDate(tm.getDate() + 1);
    return tm.toISOString().slice(0, 10);
  });

  const loadSchedules = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchCalendarSchedules(user.id);
      setSchedules(data);
    } catch (err) {
      toast.error('Failed to load schedules: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadSchedules();
  }, [loadSchedules]);

  useSupabaseRealtime('calendar_schedules', { table: 'calendar_schedules' }, () => {
    void loadSchedules();
  });

  const previousMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const todaySchedules = schedules.filter((s) => s.schedule_date === todayStr);
  const tomorrowSchedules = schedules.filter((s) => s.schedule_date === tomorrowStr);

  const openAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    setForm({ ...BLANK_FORM });
    setShowModal(true);
  };

  const openEditModal = (s: Schedule) => {
    setModalMode('edit');
    setEditingId(s.id);
    setForm({
      batch_name: s.batch_name,
      subject: s.subject,
      schedule_date: s.schedule_date,
      start_time: s.start_time.slice(0, 5),
      duration: s.duration,
      type: s.type,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({ ...BLANK_FORM });
  };

  const handleSave = async () => {
    if (!form.batch_name || !form.subject || !form.schedule_date || !form.start_time) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (!user) return;
    setSaving(true);

    try {
      if (modalMode === 'add') {
        await createScheduleService(user.id, form);
        toast.success('Schedule added!');
      } else if (editingId) {
        await updateScheduleService(editingId, form);
        toast.success('Schedule updated!');
      }
      await loadSchedules();
      closeModal();
    } catch (err) {
      toast.error('Failed to save schedule: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this schedule?')) return;
    try {
      await deleteScheduleService(id);
      toast.success('Schedule deleted.');
      await loadSchedules();
    } catch (err) {
      toast.error('Failed to delete schedule: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-gray-900 text-xl font-semibold">Class Schedule</h2>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Schedule
        </button>
      </div>

      <MonthCalendar
        currentDate={currentDate}
        schedules={schedules}
        onPreviousMonth={previousMonth}
        onNextMonth={nextMonth}
        onSelectSchedule={openEditModal}
      />

      <TodayReminder
        today={todayDate}
        todaySchedules={todaySchedules}
        loading={loading}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      <TomorrowReminder
        tomorrow={tomorrowDate}
        tomorrowSchedules={tomorrowSchedules}
        loading={loading}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      {showModal && (
        <ScheduleFormModal
          modalMode={modalMode}
          form={form}
          saving={saving}
          setForm={setForm}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
