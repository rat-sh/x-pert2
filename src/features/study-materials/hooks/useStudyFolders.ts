'use client';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { fetchFolders, createFolder, deleteFolder, updateFolder } from '../services/study-materials.service';
import type { StudyFolder } from '../types/study-materials.types';

export function useStudyFolders(teacherId: string) {
  const [folders, setFolders] = useState<StudyFolder[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const data = await fetchFolders(teacherId);
      setFolders(data);
    } catch (err) {
      toast.error('Failed to load folders');
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  const create = async (name: string, parentId: string | null, batchId?: string | null) => {
    const folder = await createFolder({ teacherId, name, parentId, batchId });
    setFolders((prev) => [...prev, folder]);
    toast.success(`Folder "${name}" created`);
    return folder;
  };

  const rename = async (id: string, name: string) => {
    await updateFolder(id, name);
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
    toast.success('Folder renamed');
  };

  const remove = async (id: string) => {
    await deleteFolder(id);
    setFolders((prev) => prev.filter((f) => f.id !== id && f.parent_id !== id));
    toast.success('Folder deleted');
  };

  // Build tree from flat array
  const buildTree = (flat: StudyFolder[], parentId: string | null = null): StudyFolder[] =>
    flat
      .filter((f) => f.parent_id === parentId)
      .map((f) => ({
        ...f,
        children: buildTree(flat, f.id),
        _count: flat.filter((x) => x.parent_id === f.id).length,
      }));

  return { folders, loading, load, create, rename, remove, tree: buildTree(folders) };
}
