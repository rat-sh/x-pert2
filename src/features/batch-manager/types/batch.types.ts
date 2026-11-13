export interface Batch {
  id: string;
  name: string;
  subject: string | null;
  join_code: string;
  is_active: boolean;
  created_at: string;
  studentCount?: number;
}

export interface BatchStudent {
  student_id: string;
  name: string;
  phone?: string | null;
  joined_at: string;
  batch_id: string;
}

export interface BatchFormData {
  name: string;
  subject: string;
  selectedDays: number[];
  classTime: string;
  duration: string;
  startDate: string;
  endDate: string;
}
