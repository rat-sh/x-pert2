export type MaterialType = 'pdf' | 'video_link' | 'note' | 'assignment' | 'practice_exam';

export interface StudyFolder {
  id: string;
  teacher_id: string;
  batch_id: string | null;
  parent_id: string | null;
  name: string;
  created_at: string;
  children?: StudyFolder[];
  _count?: number;
}

export interface StudyMaterial {
  id: string;
  folder_id: string;
  teacher_id: string;
  title: string;
  material_type: MaterialType;
  file_url: string | null;
  external_url: string | null;
  description: string | null;
  created_at: string;
}

export interface FolderWithMaterials extends StudyFolder {
  materials: StudyMaterial[];
}

export const MATERIAL_TYPE_META: Record<MaterialType, { label: string; color: string; bg: string }> = {
  pdf:          { label: 'PDF',           color: 'text-red-600',    bg: 'bg-red-50'    },
  video_link:   { label: 'Video',         color: 'text-blue-600',   bg: 'bg-blue-50'   },
  note:         { label: 'Note',          color: 'text-yellow-600', bg: 'bg-yellow-50' },
  assignment:   { label: 'Assignment',    color: 'text-green-600',  bg: 'bg-green-50'  },
  practice_exam:{ label: 'Practice Exam', color: 'text-indigo-600', bg: 'bg-indigo-50' },
};
