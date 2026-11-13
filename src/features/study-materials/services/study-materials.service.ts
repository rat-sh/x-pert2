import { supabase } from '@/shared/services/supabase-client';
import type { StudyFolder, StudyMaterial, FolderWithMaterials } from '../types/study-materials.types';

// ── Folder CRUD ──────────────────────────────────────────────────────────────

export async function fetchFolders(teacherId: string): Promise<StudyFolder[]> {
  const { data, error } = await supabase
    .from('study_folders')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function createFolder(params: {
  teacherId: string;
  name: string;
  parentId: string | null;
  batchId?: string | null;
}): Promise<StudyFolder> {
  const { data, error } = await supabase
    .from('study_folders')
    .insert({
      teacher_id: params.teacherId,
      name: params.name,
      parent_id: params.parentId,
      batch_id: params.batchId ?? null,
    })
    .select()
    .single();
  if (error || !data) throw error ?? new Error('Failed to create folder');
  return data;
}

export async function updateFolder(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('study_folders').update({ name }).eq('id', id);
  if (error) throw error;
}

export async function deleteFolder(id: string): Promise<void> {
  // Cascade deletes children + materials via DB ON DELETE CASCADE
  const { error } = await supabase.from('study_folders').delete().eq('id', id);
  if (error) throw error;
}

// ── Material CRUD ────────────────────────────────────────────────────────────

export async function fetchMaterials(folderId: string): Promise<StudyMaterial[]> {
  const { data, error } = await supabase
    .from('study_materials')
    .select('*')
    .eq('folder_id', folderId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchFolderWithMaterials(folderId: string): Promise<FolderWithMaterials | null> {
  const [{ data: folder }, { data: materials }] = await Promise.all([
    supabase.from('study_folders').select('*').eq('id', folderId).single(),
    supabase.from('study_materials').select('*').eq('folder_id', folderId).order('created_at'),
  ]);
  if (!folder) return null;
  return { ...folder, materials: materials ?? [] };
}

export async function createMaterial(params: {
  folderId: string;
  teacherId: string;
  title: string;
  materialType: string;
  fileUrl?: string | null;
  externalUrl?: string | null;
  description?: string | null;
}): Promise<StudyMaterial> {
  const { data, error } = await supabase
    .from('study_materials')
    .insert({
      folder_id: params.folderId,
      teacher_id: params.teacherId,
      title: params.title,
      material_type: params.materialType,
      file_url: params.fileUrl ?? null,
      external_url: params.externalUrl ?? null,
      description: params.description ?? null,
    })
    .select()
    .single();
  if (error || !data) throw error ?? new Error('Failed to create material');
  return data;
}

export async function deleteMaterial(id: string): Promise<void> {
  const { error } = await supabase.from('study_materials').delete().eq('id', id);
  if (error) throw error;
}

// ── Student access ───────────────────────────────────────────────────────────

export async function fetchStudentFolders(teacherIds: string[]): Promise<StudyFolder[]> {
  if (!teacherIds.length) return [];
  const { data, error } = await supabase
    .from('study_folders')
    .select('*')
    .in('teacher_id', teacherIds)
    .order('name');
  if (error) throw error;
  return data ?? [];
}
