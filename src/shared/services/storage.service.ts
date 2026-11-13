import { supabase } from './supabase-client';
import { toast } from 'sonner';

export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
): Promise<string | null> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) {
    toast.error(`Upload failed: ${error.message}`);
    return null;
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadImage(file: File, bucket = 'exam-images'): Promise<string | null> {
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  return uploadFile(bucket, path, file);
}

export async function uploadMaterial(
  file: File,
  teacherId: string,
  folderId: string,
): Promise<string | null> {
  const ext = file.name.split('.').pop() ?? 'pdf';
  const path = `materials/${teacherId}/${folderId}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  return uploadFile('study-materials', path, file);
}
