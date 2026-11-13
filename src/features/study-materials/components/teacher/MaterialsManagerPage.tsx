'use client';
import { useState, useEffect, useRef } from 'react';
import {
  FolderPlus, Plus, Folder, FolderOpen,
  FileText, Video, BookOpen, ClipboardList, X, Trash2,
  ExternalLink, Upload, LoaderCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useStudyFolders } from '@/features/study-materials/hooks/useStudyFolders';
import { useStudyMaterials } from '@/features/study-materials/hooks/useStudyMaterials';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Spinner } from '@/shared/components/ui/Spinner';
import type { StudyFolder, MaterialType } from '@/features/study-materials/types/study-materials.types';
import { MATERIAL_TYPE_META as META } from '@/features/study-materials/types/study-materials.types';

// ─── Icons per type ────────────────────────────────────────────────────────

const TYPE_ICONS: Record<MaterialType, React.ComponentType<{ className?: string }>> = {
  pdf:           FileText,
  video_link:    Video,
  note:          BookOpen,
  assignment:    ClipboardList,
  practice_exam: BookOpen,
};

// ─── Folder Tree ───────────────────────────────────────────────────────────

function FolderNode({
  folder, depth, activeId, onSelect, onDelete,
}: {
  folder: StudyFolder;
  depth: number;
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const isActive = activeId === folder.id;
  const hasChildren = (folder.children?.length ?? 0) > 0;

  return (
    <div>
      <div
        onClick={() => { setOpen((v) => !v); onSelect(folder.id); }}
        className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm
          ${isActive ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {hasChildren
          ? (open ? <FolderOpen className="w-4 h-4 shrink-0" /> : <Folder className="w-4 h-4 shrink-0" />)
          : <Folder className="w-4 h-4 shrink-0 opacity-60" />
        }
        <span className="flex-1 truncate">{folder.name}</span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(folder.id, folder.name); }}
          className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {open && hasChildren && folder.children?.map((child) => (
        <FolderNode
          key={child.id} folder={child} depth={depth + 1}
          activeId={activeId} onSelect={onSelect} onDelete={onDelete}
        />
      ))}
    </div>
  );
}

// ─── Create Folder Modal ────────────────────────────────────────────────────

function CreateFolderModal({
  parentId, onClose, onCreate,
}: { parentId: string | null; onClose: () => void; onCreate: (name: string, parentId: string | null) => Promise<void> }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onCreate(name.trim(), parentId);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          {parentId ? 'New Subfolder' : 'New Folder'}
        </h3>
        <form onSubmit={submit} className="space-y-4">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Aptitude → Reasoning"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving || !name.trim()} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add Material Modal ─────────────────────────────────────────────────────

function AddMaterialModal({
  folderId, onClose, onAdd,
}: {
  folderId: string;
  onClose: () => void;
  onAdd: (params: { folderId: string; title: string; materialType: string; file?: File | null; externalUrl?: string; description?: string }) => Promise<unknown>;
}) {
  const [form, setForm] = useState({ title: '', materialType: 'pdf' as MaterialType, externalUrl: '', description: '' });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const needsFile = form.materialType === 'pdf';
  const needsUrl  = form.materialType === 'video_link';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title required'); return; }
    if (needsFile && !file) { toast.error('Please upload a PDF file'); return; }
    if (needsUrl && !form.externalUrl.trim()) { toast.error('URL required for video links'); return; }
    setSaving(true);
    await onAdd({
      folderId,
      title: form.title,
      materialType: form.materialType,
      file: needsFile ? file : null,
      externalUrl: needsUrl ? form.externalUrl : undefined,
      description: form.description || undefined,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Add Material</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title <span className="text-red-500">*</span></label>
            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Blood Relations Notes" required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
            <select value={form.materialType} onChange={(e) => setForm((p) => ({ ...p, materialType: e.target.value as MaterialType }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {(Object.keys(META) as MaterialType[]).map((t) => (
                <option key={t} value={t}>{META[t].label}</option>
              ))}
            </select>
          </div>
          {needsFile && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">PDF File <span className="text-red-500">*</span></label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400 transition-colors"
                onClick={() => fileRef.current?.click()}>
                {file
                  ? <p className="text-sm text-gray-700">{file.name}</p>
                  : <><Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" /><p className="text-sm text-gray-500">Click to upload PDF</p></>
                }
              </div>
              <input ref={fileRef} type="file" accept="application/pdf" className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
          )}
          {needsUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Video URL <span className="text-red-500">*</span></label>
              <input type="url" value={form.externalUrl} onChange={(e) => setForm((p) => ({ ...p, externalUrl: e.target.value }))}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (optional)</label>
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2} placeholder="Brief description…"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><LoaderCircle className="w-4 h-4 animate-spin" />Uploading…</> : 'Add Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export function MaterialsManagerPage() {
  const { user } = useAuth();
  const folderHook = useStudyFolders(user?.id ?? '');
  const materialHook = useStudyMaterials(user?.id ?? '');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);

  const { load: loadFolders, tree, loading: foldersLoading } = folderHook;
  const { load: loadMaterials, materials, loading: materialsLoading } = materialHook;

  useEffect(() => {
    if (user?.id) void loadFolders();
  }, [user?.id, loadFolders]);

  useEffect(() => {
    if (activeFolderId) void loadMaterials(activeFolderId);
  }, [activeFolderId, loadMaterials]);

  const handleSelectFolder = (id: string) => setActiveFolderId(id);

  const handleDeleteFolder = async (id: string, name: string) => {
    if (!confirm(`Delete folder "${name}" and all its contents? This cannot be undone.`)) return;
    await folderHook.remove(id);
    if (activeFolderId === id) setActiveFolderId(null);
  };

  const activeFolder = folderHook.folders.find((f) => f.id === activeFolderId);

  return (
    <div className="flex gap-6 h-full min-h-[70vh]">
      {/* Left: folder tree */}
      <div className="w-64 shrink-0 bg-white rounded-xl border border-gray-200 flex flex-col">
        <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Folders</h3>
          <button onClick={() => setShowCreateFolder(true)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600" title="New root folder">
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {foldersLoading
            ? <div className="flex justify-center py-8"><Spinner /></div>
            : tree.length === 0
              ? <p className="text-xs text-gray-400 text-center px-4 py-8">No folders yet. Click + to create one.</p>
              : tree.map((f) => (
                  <FolderNode key={f.id} folder={f} depth={0}
                    activeId={activeFolderId}
                    onSelect={handleSelectFolder}
                    onDelete={handleDeleteFolder} />
                ))
          }
        </div>
      </div>

      {/* Right: folder contents */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col">
        {!activeFolderId ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState icon={Folder} title="Select a folder" description="Choose a folder from the left to view its materials." />
          </div>
        ) : (
          <>
            <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{activeFolder?.name ?? 'Folder'}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{materials.length} item{materials.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowCreateFolder(true)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                  <FolderPlus className="w-4 h-4" /> Subfolder
                </button>
                <button onClick={() => setShowAddMaterial(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                  <Plus className="w-4 h-4" /> Add Material
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {materialsLoading ? (
                <div className="flex justify-center py-12"><Spinner /></div>
              ) : materials.length === 0 ? (
                <EmptyState icon={BookOpen} title="No materials yet" description="Click 'Add Material' to upload PDFs, videos, or notes." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {materials.map((m) => {
                    const Icon = TYPE_ICONS[m.material_type as MaterialType] ?? FileText;
                    const meta = META[m.material_type as MaterialType];
                    const url = m.file_url ?? m.external_url;
                    return (
                      <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-4 group hover:shadow-md transition-shadow relative">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${meta?.bg ?? 'bg-gray-100'}`}>
                            <Icon className={`w-5 h-5 ${meta?.color ?? 'text-gray-600'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{m.title}</p>
                            <span className={`text-xs font-medium ${meta?.color ?? 'text-gray-500'}`}>{meta?.label ?? m.material_type}</span>
                            {m.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{m.description}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
                          {url && (
                            <a href={url} target="_blank" rel="noreferrer"
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                              <ExternalLink className="w-3.5 h-3.5" /> Open
                            </a>
                          )}
                          <button onClick={() => void materialHook.remove(m.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showCreateFolder && (
        <CreateFolderModal
          parentId={activeFolderId}
          onClose={() => setShowCreateFolder(false)}
          onCreate={async (name, parentId) => { await folderHook.create(name, parentId); }}
        />
      )}
      {showAddMaterial && activeFolderId && (
        <AddMaterialModal
          folderId={activeFolderId}
          onClose={() => setShowAddMaterial(false)}
          onAdd={materialHook.add}
        />
      )}
    </div>
  );
}
