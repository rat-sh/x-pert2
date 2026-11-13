export interface Schedule {
  id: string;
  teacher_id: string;
  batch_name: string;
  subject: string;
  schedule_date: string;
  start_time: string;
  duration: string;
  type: 'class' | 'exam';
  created_at: string;
}

export type CalendarSchedule = Schedule;

export type ModalMode = 'add' | 'edit';

export interface ScheduleFormData {
  batch_name: string;
  subject: string;
  schedule_date: string;
  start_time: string;
  duration: string;
  type: 'class' | 'exam';
}
