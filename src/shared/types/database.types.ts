// ─── Database Types ──────────────────────────────────────────────────────────
// Migrated from x-pert_web/src/lib/supabase.ts
// Single source of truth for all DB entity shapes.

export type UserRole = 'teacher' | 'student' | 'parent';

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  email: string | null;
  phone: string | null;
  preferred_language?: 'en' | 'hi';
  date_of_birth?: string | null;
  pin_hash?: string | null;
  pin_set_at?: string | null;
  created_at: string;
}

export interface Teacher {
  id: string;
  institution_name: string | null;
  upi_id?: string | null;
  upi_qr_url?: string | null;
  plan: 'free' | 'pro';
  plan_expires_at?: string | null;
  created_at?: string;
}

export interface Batch {
  id: string;
  teacher_id: string;
  name: string;
  subject: string | null;
  board?: 'cbse' | 'icse' | 'jee' | 'neet' | 'state' | 'aptitude' | null;
  join_code: string;
  is_active: boolean;
  academic_year?: string | null;
  created_at: string;
}

export interface BatchEnrollment {
  id: string;
  batch_id: string;
  student_id: string;
  enrolled_at: string;
  is_active: boolean;
}

export type ExamStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'archived';
export type ExamType = 'test' | 'pyq_practice' | 'mock';
export type BoardTag = 'cbse' | 'icse' | 'jee' | 'neet' | 'state' | 'aptitude';

export interface Exam {
  id: string;
  batch_id: string;
  teacher_id: string;
  title: string;
  subject: string | null;
  exam_type?: ExamType;
  board_tag?: BoardTag | null;
  duration_minutes: number;
  total_marks: number;
  negative_marking: boolean;
  negative_marks_per_wrong: number;
  exam_key?: string | null;
  exam_pin?: string | null;
  share_link?: string | null;
  batch_ids?: string[];
  is_published: boolean;
  status?: ExamStatus;
  allow_pyq?: boolean;
  no_reverse_back?: boolean;
  per_question_time_seconds?: number | null;
  is_instant?: boolean;
  instant_expires_at?: string | null;
  /** null = open exam (no time restriction) */
  scheduled_at: string | null;
  created_at: string;
  // joined
  batches?: Batch;
}

export type QuestionType = 'mcq' | 'true_false' | 'numerical' | 'theoretical';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  exam_id: string | null;
  pyq_bank_id?: string | null;
  question_text: string;
  question_type: QuestionType;
  options: string[] | null;
  correct_answer: string | null;
  marks: number;
  positive_marks?: number;
  negative_marks?: number;
  option_images?: (string | null)[] | null;
  question_image?: string | null;
  chapter_tag?: string | null;
  difficulty?: Difficulty | null;
  order_index: number;
  is_pyq: boolean;
  section_title?: string | null;
  created_at?: string;
}

export interface ExamSubmission {
  id: string;
  exam_id: string;
  student_id: string;
  started_at: string;
  submitted_at: string | null;
  server_end_time?: string | null;
  total_score: number | null;
  percentage?: number | null;
  rank_in_batch?: number | null;
  tab_switch_count: number;
  exams?: Exam;
  users?: UserProfile;
  batches?: Batch;
  submission_answers?: SubmissionAnswer[];
}

export interface SubmissionAnswer {
  id: string;
  submission_id: string;
  question_id: string;
  student_answer: string | null;
  is_correct: boolean | null;
  marks_awarded: number | null;
  questions?: Question;
}

export interface CalendarSchedule {
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

export interface Assignment {
  id: string;
  batch_id: string;
  teacher_id: string;
  title: string;
  description?: string | null;
  deadline: string;
  max_marks: number;
  created_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url?: string | null;
  file_name?: string | null;
  submitted_at: string;
  is_late: boolean;
  score?: number | null;
  feedback?: string | null;
  graded_at?: string | null;
}

export interface AttendanceRecord {
  id: string;
  batch_id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent';
  marked_by: string;
  created_at: string;
}

export interface Note {
  id: string;
  batch_id: string;
  teacher_id: string;
  title: string;
  chapter_tag?: string | null;
  file_url: string;
  file_type: 'pdf' | 'image' | 'link';
  created_at: string;
}

export interface Recording {
  id: string;
  batch_id: string;
  teacher_id: string;
  title: string;
  chapter_tag?: string | null;
  video_url: string;
  recorded_on: string;
  created_at: string;
}

export interface Doubt {
  id: string;
  batch_id: string;
  student_id: string;
  title: string;
  body: string;
  chapter_tag?: string | null;
  is_resolved: boolean;
  created_at: string;
}

export interface DoubtReply {
  id: string;
  doubt_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface PaymentLog {
  id: string;
  batch_id: string;
  student_id: string;
  month: string;
  is_paid: boolean;
  marked_by: string;
  marked_at?: string | null;
  created_at: string;
}

export interface TodoItem {
  id: string;
  created_by: string;
  batch_id?: string | null;
  title: string;
  due_date?: string | null;
  priority?: 'high' | 'medium' | 'low';
  is_done: boolean;
  is_batch_wide: boolean;
  created_at: string;
}

export interface StudentExamViewRow {
  id: string;
  batch_id: string | null;
  batch_ids: string[] | null;
  teacher_id: string;
  title: string;
  subject: string | null;
  exam_type: ExamType;
  board_tag: BoardTag | null;
  duration_minutes: number;
  total_marks: number;
  negative_marking: boolean;
  negative_marks_per_wrong: number;
  is_published: boolean;
  status: ExamStatus;
  allow_pyq: boolean;
  no_reverse_back: boolean;
  per_question_time_seconds: number | null;
  is_instant: boolean;
  instant_expires_at: string | null;
  scheduled_at: string | null;
  created_at: string;
}

export interface StudentQuestionViewRow {
  id: string;
  exam_id: string | null;
  question_text: string;
  question_type: QuestionType;
  options: unknown;
  marks: number;
  positive_marks: number;
  negative_marks: number;
  option_images: unknown;
  question_image: string | null;
  chapter_tag: string | null;
  difficulty: Difficulty;
  order_index: number;
  is_pyq: boolean;
  section_title: string | null;
}

export interface StudentResultViewRow {
  submission_id: string;
  exam_id: string;
  exam_title: string;
  total_score: number | null;
  total_marks: number;
  started_at: string;
  submitted_at: string;
  percentage: number | null;
}

export interface StudentAnswerReviewViewRow {
  submission_id: string;
  question_id: string;
  question_text: string;
  question_type: QuestionType;
  correct_answer: string | null;
  student_answer: string | null;
  is_correct: boolean | null;
  marks_awarded: number | null;
  max_marks: number;
}
