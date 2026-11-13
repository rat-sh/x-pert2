import { z } from 'zod';

export const ExamDetailsSchema = z.object({
  title: z.string().min(1, 'Exam title is required'),
  subject: z.string().min(1, 'Subject is required'),
  batch_ids: z.array(z.string()).min(1, 'Select at least one batch'),
  duration_minutes: z.number().min(5).max(300).default(60),
  scheduled_date: z.string().optional().default(''),
  scheduled_time: z.string().optional().default(''),
  is_instant: z.boolean().default(false),
  allow_pyq: z.boolean().default(false),
  no_reverse_back: z.boolean().default(false),
  per_question_time_enabled: z.boolean().default(false),
  per_question_time_seconds: z.number().min(10).max(600).default(60),
});

export type ExamDetailsFormData = z.infer<typeof ExamDetailsSchema>;
