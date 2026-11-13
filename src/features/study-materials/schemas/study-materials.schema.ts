import { z } from 'zod';

export const FolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(80),
  batch_id: z.string().uuid().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
});

export const MaterialSchema = z.object({
  title: z.string().min(1, 'Title is required').max(120),
  material_type: z.enum(['pdf', 'video_link', 'note', 'assignment', 'practice_exam']),
  external_url: z.string().url('Must be a valid URL').or(z.literal('')).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
});

export type FolderFormValues = z.infer<typeof FolderSchema>;
export type MaterialFormValues = z.infer<typeof MaterialSchema>;
