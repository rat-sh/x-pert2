'use client';
import { useState, useEffect } from 'react';
import { ChevronRight, Folder, FileText, Video, BookOpen, ClipboardList, ExternalLink, Home } from 'lucide-react';
import { useStudent } from '@/contexts/StudentContext';
import { useStudyFolders } from '@/features/study-materials/hooks/useStudyFolders';
import { useStudyMaterials } from '@/features/study-materials/hooks/useStudyMaterials';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Spinner } from '@/shared/components/ui/Spinner';
import type { StudyFolder, MaterialType } from '@/features/study-materials/types/study-materials.types';
import { MATERIAL_TYPE_META as META } from '@/features/study-materials/types/study-materials.types';

const TYPE_ICONS: Record<MaterialType, React.ComponentType<{ className?: string }>> = {
  pdf:           FileText,
  video_link:    Video,
  note:          BookOpen,
  assignment:    ClipboardList,
  practice_exam: BookOpen,
};

export function MaterialsBrowserPage() {
  const { student } = useStudent();
  const [teacherIds, setTeacherIds] = useState<string[]>([]);
  const [allFolders, setAllFolders] = useState<StudyFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<StudyFolder[]>([]);
  const materialHook = useStudyMaterials(student?.id ?? '');
  const [loading, setLoading] = useState(true);

  // Load folders for all enrolled teachers
  useEffect(() => {
    if (!student) return;
    // In a real app, fetch teacher_ids from batch_enrollments → batches → teacher_id
    // For now, load all folders visible to this student via shared service
    import('@/features/study-materials/services/study-materials.service').then(({ fetchStudentFolders }) => {
      if (teacherIds.length === 0) { setLoading(false); return; }
      fetchStudentFolders(teacherIds).then((data) => { setAllFolders(data); setLoading(false); });
    });
  }, [student, teacherIds]);

  const subFolders = allFolders.filter((f) => f.parent_id === activeFolderId);

  const handleOpen = (folder: StudyFolder) => {
    setActiveFolderId(folder.id);
    setBreadcrumb((prev) => [...prev, folder]);
    void materialHook.load(folder.id);
  };

  const handleBreadcrumbClick = (idx: number) => {
    if (idx < 0) {
      setActiveFolderId(null);
      setBreadcrumb([]);
      return;
    }
    const folder = breadcrumb[idx];
    setActiveFolderId(folder.id);
    setBreadcrumb((prev) => prev.slice(0, idx + 1));
    void materialHook.load(folder.id);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Study Materials</h2>
        <p className="text-sm text-gray-500 mt-0.5">Browse notes, videos, and resources from your teachers.</p>
      </div>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm">
        <button onClick={() => handleBreadcrumbClick(-1)} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800">
          <Home className="w-4 h-4" /> Home
        </button>
        {breadcrumb.map((f, i) => (
          <span key={f.id} className="flex items-center gap-1">
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <button onClick={() => handleBreadcrumbClick(i)} className="text-indigo-600 hover:text-indigo-800 truncate max-w-[120px]">{f.name}</button>
          </span>
        ))}
      </nav>

      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> : (
        <div className="space-y-6">
          {/* Subfolders */}
          {subFolders.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Folders</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {subFolders.map((f) => (
                  <button key={f.id} onClick={() => handleOpen(f)}
                    className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl text-left hover:shadow-md hover:border-indigo-300 transition-all">
                    <Folder className="w-6 h-6 text-indigo-500 shrink-0" />
                    <span className="text-sm font-medium text-gray-900 truncate">{f.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Materials */}
          {activeFolderId && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Materials</h3>
              {materialHook.loading ? <div className="flex justify-center py-8"><Spinner /></div>
                : materialHook.materials.length === 0
                  ? <EmptyState icon={BookOpen} title="No materials" description="No materials in this folder yet." />
                  : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {materialHook.materials.map((m) => {
                        const Icon = TYPE_ICONS[m.material_type as MaterialType] ?? FileText;
                        const meta = META[m.material_type as MaterialType];
                        const url = m.file_url ?? m.external_url;
                        return (
                          <a key={m.id} href={url ?? '#'} target={url ? '_blank' : undefined} rel="noreferrer"
                            className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-indigo-300 transition-all group">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${meta?.bg ?? 'bg-gray-100'}`}>
                              <Icon className={`w-5 h-5 ${meta?.color ?? 'text-gray-600'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-700 truncate">{m.title}</p>
                              <span className={`text-xs ${meta?.color ?? 'text-gray-500'}`}>{meta?.label}</span>
                              {m.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{m.description}</p>}
                            </div>
                            {url && <ExternalLink className="w-4 h-4 text-gray-400 shrink-0 opacity-0 group-hover:opacity-100" />}
                          </a>
                        );
                      })}
                    </div>
                  )
              }
            </div>
          )}

          {subFolders.length === 0 && (!activeFolderId || materialHook.materials.length === 0) && (
            <EmptyState icon={Folder} title="Nothing here yet" description="Your teachers haven't added materials to this section." />
          )}
        </div>
      )}
    </div>
  );
}
