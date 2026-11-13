export type ExamStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'archived';

export interface ExamDetails {
  title: string;
  subject: string;
  batch_ids: string[];
  duration_minutes: number;
  scheduled_date: string;
  scheduled_time: string;
  is_instant: boolean;
  allow_pyq: boolean;
  no_reverse_back: boolean;
  per_question_time_enabled: boolean;
  per_question_time_seconds: number;
}

export interface ExamRow {
  id: string;
  title: string;
  subject?: string | null;
  status?: ExamStatus;
  batch_id?: string | null;
  batch_ids?: string[] | null;
  duration_minutes: number;
  total_marks: number;
  scheduled_at?: string | null;
  exam_key?: string | null;
  exam_pin?: string | null;
  is_instant?: boolean;
  allow_pyq?: boolean;
  no_reverse_back?: boolean;
  per_question_time_seconds?: number | null;
  is_published?: boolean;
  teacher_id?: string;
  created_at?: string;
  batches?: { name: string; subject?: string } | null;
  questionCount?: number;
  hasAttempts?: boolean;
}

export type Step = 'details' | 'questions';
export type ActiveModal = null | 'settings' | 'preview' | 'confirm-delete' | 'regen-key';
