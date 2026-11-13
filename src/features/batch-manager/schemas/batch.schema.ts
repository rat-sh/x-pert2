import { z } from 'zod';

export const BatchFormSchema = z.object({
  name: z.string().min(1, 'Batch name is required').max(60),
  subject: z.string().max(60).optional(),
  schedule: z.string().max(200).optional(),
});

export type BatchFormValues = z.infer<typeof BatchFormSchema>;
