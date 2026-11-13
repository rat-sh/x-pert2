'use client';
import { useState, useRef } from 'react';
import {
  Plus, Trash2, ChevronDown, Check, Copy, Heading2,
  AlignLeft, List, Image as ImageIcon, X,
} from 'lucide-react';
import type {
  QuestionType, DraftOption, SectionItem, QuestionItem, PaperItem,
} from '../types/paper-builder.types';
import { uid, blankQuestion, blankSection, questionsToPaperItems, getQuestionsFromItems } from '../utils/paper-builder.utils';

export type { QuestionType, DraftOption, SectionItem, QuestionItem, PaperItem };
export { uid, blankQuestion, blankSection, questionsToPaperItems, getQuestionsFromItems };

interface Props {
  items: PaperItem[];
  onChange: (items: PaperItem[]) => void;
  onUploadImage: (file: File) => Promise<string | null>;
  uploading?: boolean;
}

const TYPE_META: Record<QuestionType, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  mcq:         { label: 'Multiple Choice', icon: List },
  true_false:  { label: 'True / False',    icon: Check },
  numerical:   { label: 'Numerical',       icon: AlignLeft },
  theoretical: { label: 'Theoretical',     icon: AlignLeft },
};

const ALL_TYPES = Object.keys(TYPE_META) as QuestionType[];

function TypeDropdown({ value, onChange }: { value: QuestionType; onChange: (t: QuestionType) => void }) {
  const [open, setOpen] = useState(false);
  const Meta = TYPE_META[value];
  const Icon = Meta.icon;
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:border-indigo-400 hover:bg-indigo-50 transition-colors min-w-[170px] justify-between">
        <span className="flex items-center gap-2"><Icon className="w-4 h-4 text-gray-500" />{Meta.label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[190px] py-1">
          {ALL_TYPES.map((t) => {
            const M = TYPE_META[t]; const Ic = M.icon;
            return (
              <button key={t} type="button" onClick={() => { onChange(t); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${t === value ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                <Ic className="w-4 h-4 shrink-0" />{M.label}
                {t === value && <Check className="w-3.5 h-3.5 ml-auto" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OptionRow({ index, opt, isCorrect, onTextChange, onToggleCorrect, onDelete, onImageUpload, onRemoveImage, canDelete, uploading }: {
  index: number; opt: DraftOption; isCorrect: boolean;
  onTextChange: (v: string) => void; onToggleCorrect: () => void; onDelete: () => void;
  onImageUpload: (f: File) => void; onRemoveImage: () => void; canDelete: boolean; uploading?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 group">
      <button type="button" onClick={onToggleCorrect}
        className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isCorrect ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300 hover:border-indigo-400'}`}>
        {isCorrect && <Check className="w-3 h-3 text-white" />}
      </button>
      {opt.imageUrl ? (
        <div className="flex-1 flex items-center gap-2">
          <img src={opt.imageUrl} alt={`option ${index + 1}`} className="h-14 rounded object-contain border border-gray-200 bg-gray-50" />
          <button type="button" onClick={onRemoveImage} className="text-xs text-red-500 hover:text-red-700">Remove</button>
        </div>
      ) : (
        <input type="text" value={opt.text} onChange={(e) => onTextChange(e.target.value)}
          placeholder={`Option ${String.fromCharCode(65 + index)}`}
          className="flex-1 px-0 py-1 text-sm text-gray-800 border-b border-transparent focus:border-indigo-400 focus:outline-none bg-transparent placeholder:text-gray-300" />
      )}
      <label className="shrink-0 cursor-pointer text-gray-400 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50">
        <ImageIcon className="w-4 h-4" />
        <input type="file" accept="image/*" className="hidden" disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onImageUpload(f); e.target.value = ''; }} />
      </label>
      {canDelete && (
        <button type="button" onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function SectionCard({ s, onUpdate, onDelete }: { s: SectionItem; onUpdate: (p: Partial<SectionItem>) => void; onDelete: () => void }) {
  return (
    <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-5 space-y-3 relative group">
      <div className="flex items-center gap-3">
        <Heading2 className="w-5 h-5 text-indigo-500 shrink-0" />
        <input type="text" value={s.title} onChange={(e) => onUpdate({ title: e.target.value })}
          className="flex-1 bg-transparent text-base font-semibold text-indigo-900 focus:outline-none border-b border-indigo-200 focus:border-indigo-500 py-0.5"
          placeholder="Section Title (e.g. Part A)" />
        <button type="button" onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1.5 text-indigo-300 hover:text-red-500 rounded-lg transition-all">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-4 ml-8">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-indigo-600">Pos (+)</label>
          <input type="number" min={0} step={0.5} value={s.positive_marks}
            onChange={(e) => onUpdate({ positive_marks: parseFloat(e.target.value) || 1 })}
            className="w-16 px-2 py-1 border border-indigo-200 rounded-lg text-sm text-center bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-indigo-600">Neg (−)</label>
          <input type="number" min={0} step={0.25} value={s.negative_marks}
            onChange={(e) => onUpdate({ negative_marks: parseFloat(e.target.value) || 0 })}
            className="w-16 px-2 py-1 border border-indigo-200 rounded-lg text-sm text-center bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <span className="text-xs text-indigo-500">Default marks for questions in this section</span>
      </div>
    </div>
  );
}

function QuestionCard({ q, index, total, onUpdate, onDelete, onDuplicate, onUploadImage, uploading }: {
  q: QuestionItem; index: number; total: number;
  onUpdate: (p: Partial<QuestionItem>) => void;
  onDelete: () => void; onDuplicate: () => void;
  onUploadImage: (f: File) => Promise<string | null>; uploading?: boolean;
}) {
  const qImageRef = useRef<HTMLInputElement>(null);

  const handleTypeChange = (t: QuestionType) => {
    const patch: Partial<QuestionItem> = { question_type: t };
    patch.options = t === 'mcq' ? (q.options.length >= 2 ? q.options : [{ text: '', imageUrl: null }, { text: '', imageUrl: null }]) : [];
    if (t === 'true_false') patch.correct_answer = '';
    onUpdate(patch);
  };

  const updateOption = (i: number, val: Partial<DraftOption>) => {
    const opts = [...q.options]; opts[i] = { ...opts[i], ...val }; onUpdate({ options: opts });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group relative">
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-indigo-500 opacity-0 group-focus-within:opacity-100 transition-opacity" />
      <div className="p-5">
        <div className="flex gap-4">
          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex items-start gap-2">
              <span className="text-xs font-semibold text-gray-400 mt-2.5 w-6 shrink-0 text-right">{index + 1}.</span>
              <div className="flex-1 space-y-2">
                {q.question_image && (
                  <div className="relative inline-block">
                    <img src={q.question_image} alt="question" className="h-24 rounded-lg border border-gray-200 object-contain bg-gray-50" />
                    <button type="button" onClick={() => onUpdate({ question_image: null })}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <textarea value={q.question_text} onChange={(e) => onUpdate({ question_text: e.target.value })}
                  placeholder="Question" rows={2}
                  className="w-full text-sm text-gray-900 placeholder:text-gray-300 border-b border-gray-200 focus:border-indigo-400 focus:outline-none resize-none bg-transparent py-1 leading-relaxed" />
                <button type="button" onClick={() => qImageRef.current?.click()} disabled={uploading}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50">
                  <ImageIcon className="w-3.5 h-3.5" /> {q.question_image ? 'Change image' : 'Add image'}
                </button>
                <input ref={qImageRef} type="file" accept="image/*" className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) { const url = await onUploadImage(f); if (url) onUpdate({ question_image: url }); }
                    e.target.value = '';
                  }} />
              </div>
            </div>
            {q.question_type === 'mcq' && (
              <div className="ml-8 space-y-2">
                {q.options.map((opt, i) => (
                  <OptionRow key={i} index={i} opt={opt}
                    isCorrect={q.correct_answer === opt.text && !!(opt.text || opt.imageUrl)}
                    onTextChange={(v) => { const wasCorrect = q.correct_answer === opt.text; updateOption(i, { text: v }); if (wasCorrect) onUpdate({ correct_answer: v }); }}
                    onToggleCorrect={() => onUpdate({ correct_answer: opt.text || `__img_${i}__` })}
                    onDelete={() => { const opts = q.options.filter((_, j) => j !== i); onUpdate({ options: opts, correct_answer: q.correct_answer === opt.text ? '' : q.correct_answer }); }}
                    onImageUpload={async (f) => { const url = await onUploadImage(f); if (url) updateOption(i, { imageUrl: url, text: opt.text || `Option ${String.fromCharCode(65 + i)}` }); }}
                    onRemoveImage={() => updateOption(i, { imageUrl: null })}
                    canDelete={q.options.length > 2} uploading={uploading} />
                ))}
                <button type="button" onClick={() => onUpdate({ options: [...q.options, { text: '', imageUrl: null }] })}
                  className="ml-7 text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 mt-1">
                  <Plus className="w-3.5 h-3.5" /> Add option
                </button>
              </div>
            )}
            {q.question_type === 'true_false' && (
              <div className="ml-8 flex gap-4">
                {['True', 'False'].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="radio" name={`tf-${q.id}`} checked={q.correct_answer === opt}
                      onChange={() => onUpdate({ correct_answer: opt })} className="w-4 h-4 text-indigo-600" />
                    {opt}
                  </label>
                ))}
              </div>
            )}
            {q.question_type === 'numerical' && (
              <div className="ml-8">
                <input type="text" placeholder="Correct numerical answer" value={q.correct_answer}
                  onChange={(e) => onUpdate({ correct_answer: e.target.value })}
                  className="w-full text-sm border-b border-dashed border-gray-300 focus:border-indigo-400 focus:outline-none bg-transparent py-1" />
              </div>
            )}
            {q.question_type === 'theoretical' && (
              <div className="ml-8 border border-dashed border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-400 italic">
                Long answer · manually graded
              </div>
            )}
          </div>
          <div className="shrink-0 w-[190px] flex flex-col gap-3 pt-0.5">
            <TypeDropdown value={q.question_type} onChange={handleTypeChange} />
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 shrink-0">Pos (+)</label>
              <input type="number" min={0} step={0.5} value={q.positive_marks}
                onChange={(e) => onUpdate({ positive_marks: parseFloat(e.target.value) || 1 })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 shrink-0">Neg (−)</label>
              <input type="number" min={0} step={0.25} value={q.negative_marks}
                onChange={(e) => onUpdate({ negative_marks: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <select value={q.difficulty} onChange={(e) => onUpdate({ difficulty: e.target.value as QuestionItem['difficulty'] })}
              className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" checked={q.is_pyq} onChange={(e) => onUpdate({ is_pyq: e.target.checked })}
                className="w-3.5 h-3.5 text-indigo-600 rounded" />
              PYQ
            </label>
            <div className="flex items-center gap-1 pt-1 border-t border-gray-100">
              <button type="button" onClick={onDuplicate} title="Duplicate"
                className="flex-1 flex items-center justify-center py-1.5 text-xs text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={onDelete} title="Delete" disabled={total <= 1}
                className="flex-1 flex items-center justify-center py-1.5 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddBar({ onAddQuestion, onAddSection }: { onAddQuestion: () => void; onAddSection: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-px bg-gray-200" />
      <button type="button" onClick={onAddQuestion}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-dashed border-indigo-300 text-indigo-600 text-sm hover:bg-indigo-50 hover:border-indigo-500 transition-colors">
        <Plus className="w-4 h-4" /> Question
      </button>
      <button type="button" onClick={onAddSection}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-dashed border-gray-300 text-gray-500 text-sm hover:bg-gray-50 hover:border-gray-400 transition-colors">
        <Heading2 className="w-4 h-4" /> Section
      </button>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

export function QuestionPaperBuilder({ items, onChange, onUploadImage, uploading }: Props) {
  const lastTypeRef = useRef<QuestionType>('mcq');

  const getSection = (sectionId: string | null): SectionItem | null => {
    if (!sectionId) return null;
    const s = items.find((i) => i.id === sectionId && i.itemType === 'section');
    return s ? (s as SectionItem) : null;
  };

  const updateItem = (id: string, patch: Partial<PaperItem>) => {
    const next = items.map((item) => item.id !== id ? item : { ...item, ...patch } as PaperItem);
    if (patch && ('positive_marks' in patch || 'negative_marks' in patch)) {
      const sec = next.find((i) => i.id === id && i.itemType === 'section') as SectionItem | undefined;
      if (sec) {
        onChange(next.map((item) => {
          if (item.itemType === 'question' && (item as QuestionItem).sectionId === id) {
            return { ...item, positive_marks: sec.positive_marks, negative_marks: sec.negative_marks } as QuestionItem;
          }
          return item;
        }));
        return;
      }
    }
    if ('question_type' in patch) lastTypeRef.current = (patch as Partial<QuestionItem>).question_type!;
    onChange(next);
  };

  const deleteItem = (id: string) => onChange(items.filter((i) => i.id !== id));

  const duplicateQuestion = (q: QuestionItem) => {
    const copy: QuestionItem = { ...q, id: uid(), dbId: undefined };
    const idx = items.findIndex((i) => i.id === q.id);
    const next = [...items]; next.splice(idx + 1, 0, copy); onChange(next);
  };

  const addQuestion = () => {
    const sections = items.filter((i) => i.itemType === 'section') as SectionItem[];
    const lastSection = sections.length > 0 ? sections[sections.length - 1] : null;
    onChange([...items, blankQuestion(lastTypeRef.current, lastSection?.id ?? null, lastSection)]);
  };

  const addSection = () => onChange([...items, blankSection()]);

  const updateSection = (section: SectionItem, patch: Partial<SectionItem>) => {
    const updated = { ...section, ...patch };
    onChange(items.map((item) => {
      if (item.id === section.id) return updated;
      if (item.itemType === 'question' && (item as QuestionItem).sectionId === section.id) {
        return { ...item, positive_marks: patch.positive_marks ?? (item as QuestionItem).positive_marks, negative_marks: patch.negative_marks ?? (item as QuestionItem).negative_marks };
      }
      return item;
    }));
  };

  const questions = items.filter((i) => i.itemType === 'question') as QuestionItem[];

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        if (item.itemType === 'section') {
          const s = item as SectionItem;
          return <SectionCard key={s.id} s={s} onUpdate={(p) => updateSection(s, p)} onDelete={() => deleteItem(s.id)} />;
        }
        const q = item as QuestionItem;
        const qIndex = items.slice(0, idx).filter((i) => i.itemType === 'question').length;
        return (
          <QuestionCard key={q.id} q={q} index={qIndex} total={questions.length}
            onUpdate={(p) => updateItem(q.id, p)}
            onDelete={() => deleteItem(q.id)}
            onDuplicate={() => duplicateQuestion(q)}
            onUploadImage={onUploadImage} uploading={uploading} />
        );
      })}
      <AddBar onAddQuestion={addQuestion} onAddSection={addSection} />
      {questions.length > 0 && (
        <div className="text-center text-xs text-gray-400 pb-2">
          {questions.length} question{questions.length !== 1 ? 's' : ''} · {questions.reduce((s, q) => s + q.positive_marks, 0)} marks total
        </div>
      )}
    </div>
  );
}
