export interface StudentExamRow {
  id: string;
  title: string;
  subject?: string | null;
  duration_minutes: number;
  total_marks: number;
  scheduled_at?: string | null;
  exam_key?: string | null;
  status?: string;
  is_instant?: boolean;
  allow_pyq?: boolean;
  no_reverse_back?: boolean;
  per_question_time_seconds?: number | null;
  batch_name?: string;
  batch_id?: string | null;
  batch_ids?: string[] | null;
  submission?: { id: string; score: number; submitted_at: string } | null;
}

export interface ExamQuestion {
  id: string;
  question_text: string;
  question_image?: string | null;
  question_type: 'mcq' | 'true_false' | 'numerical' | 'theoretical';
  options?: string[] | null;
  option_images?: (string | null)[] | null;
  positive_marks: number;
  negative_marks: number;
  order_index: number;
}

export type ExamView = 'list' | 'taking' | 'submitted';
