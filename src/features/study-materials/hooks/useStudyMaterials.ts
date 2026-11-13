'use client';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { fetchMaterials, createMaterial, deleteMaterial } from '../services/study-materials.service';
import { uploadMaterial } from '@/shared/services/storage.service';
import type { StudyMaterial } from '../types/study-materials.types';

export function useStudyMaterials(teacherId: string) {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const load = useCallback(async (folderId: string) => {
    setCurrentFolderId(folderId);
    setLoading(true);
    try {
      const data = await fetchMaterials(folderId);
      setMaterials(data);
    } catch {
      toast.error('Failed to load materials');
    } finally {
      setLoading(false);
    }
  }, []);

  const add = async (params: {
    folderId: string;
    title: string;
    materialType: string;
    file?: File | null;
    externalUrl?: string;
    description?: string;
  }) => {
    let fileUrl: string | null = null;
    if (params.file) {
      fileUrl = await uploadMaterial(params.file, teacherId, params.folderId);
      if (!fileUrl) return null;
    }
    const material = await createMaterial({
      folderId: params.folderId,
      teacherId,
      title: params.title,
      materialType: params.materialType,
      fileUrl,
      externalUrl: params.externalUrl ?? null,
      description: params.description ?? null,
    });
    setMaterials((prev) => [material, ...prev]);
    toast.success(`"${params.title}" added`);
    return material;
  };

  const remove = async (id: string) => {
    await deleteMaterial(id);
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    toast.success('Material deleted');
  };

  return { materials, loading, currentFolderId, load, add, remove };
}
