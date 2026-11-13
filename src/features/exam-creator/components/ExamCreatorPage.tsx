'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, X, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/shared/services/supabase-client';
import { Batch } from '@/shared/types/database.types';
import { useAuth } from '@/contexts/AuthContext';
import { PaperItem } from '@/features/question-builder/components/QuestionPaperBuilder';
import { ExtractedQuestion } from '@/features/question-extraction/components/QuestionExtractionUpload';

import { ExamDetails, ExamRow, Step, ActiveModal } from '../types/exam-creator.types';
import { createInitialPaper, paperItemsFromExtracted } from '../utils/exam-creator.utils';
import {
  fetchTeacherExams,
  saveAllQuestions,
  publishExamKey,
  duplicateExamService,
  toggleArchiveExamService,
  softDeleteExamService,
  updateExamSettingsService,
  uploadExamImage,
} from '../services/exam-creator.service';

import { StepIndicator } from './StepIndicator';
import { ExamDetailsStep } from './ExamDetailsStep';
import { ExamQuestionsStep } from './ExamQuestionsStep';
import { ExamCard } from './ExamCard';
import { UpdateSettingsModal } from './UpdateSettingsModal';
import { ExamPreviewModal } from './ExamPreviewModal';
import { ExamDeleteConfirmModal } from './ExamDeleteConfirmModal';
import { RegenKeyModal } from './RegenKeyModal';

const BLANK_DETAILS: ExamDetails = {
  title: '', subject: '', batch_ids: [], duration_minutes: 60,
  scheduled_date: '', scheduled_time: '', is_instant: false, allow_pyq: false,
  no_reverse_back: false, per_question_time_enabled: false, per_question_time_seconds: 60,
};

export function ExamCreatorPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [exams, setExams] = useState<ExamRow[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [creating, setCreating] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('details');
  const [details, setDetails] = useState<ExamDetails>(BLANK_DETAILS);
  const [savedExamId, setSavedExamId] = useState<string | null>(null);
  const [paperItems, setPaperItems] = useState<PaperItem[]>(createInitialPaper);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [questionsDirty, setQuestionsDirty] = useState(false);
  const [loadingExams, setLoadingExams] = useState(true);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [activeExam, setActiveExam] = useState<ExamRow | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);

  const fetchExams = useCallback(async () => {
    if (!user) return;
    setLoadingExams(true);
    try {
      const data = await fetchTeacherExams(user.id);
      setExams(data);
    } catch (err) {
      toast.error('Failed to load exams: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoadingExams(false);
    }
  }, [user]);

  const fetchBatches = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('batches').select('*').eq('teacher_id', user.id);
    setBatches(data ?? []);
  }, [user]);

  useEffect(() => {
    void (async () => { await fetchExams(); await fetchBatches(); })();
  }, [fetchExams, fetchBatches]);

  const handleSaveDetails = async () => {
    if (!user) return;
    if (!details.title.trim() || !details.subject.trim() || details.batch_ids.length === 0) {
      toast.error('Please fill title, subject, and select at least one batch.');
      return;
    }

    try {
      setSavedExamId(editingExamId);
      setStep('questions');
      toast.success('Exam details ready. Add questions, then save the complete paper.');
    } catch (err) {
      toast.error('Failed to save exam details: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const loadQuestionsForExam = async (examId: string) => {
    const { data } = await supabase.from('questions').select('*').eq('exam_id', examId).order('order_index');
    if (!data || data.length === 0) {
      setPaperItems(createInitialPaper());
    } else {
      const { questionsToPaperItems } = await import('@/features/question-builder/components/QuestionPaperBuilder');
      setPaperItems(questionsToPaperItems(data));
    }
    setQuestionsDirty(false);
  };

  const handlePaperChange = (items: PaperItem[]) => {
    setPaperItems(items);
    setQuestionsDirty(true);
  };

  const persistExamPaper = async (): Promise<string | null> => {
    if (!user) return null;
    setSavingQuestions(true);
    try {
      const existingExam = editingExamId ? exams.find((exam) => exam.id === editingExamId) : undefined;
      const examId = await saveAllQuestions(user.id, details, savedExamId, existingExam, paperItems);
      setSavedExamId(examId);
      setPaperItems([...paperItems]);
      setQuestionsDirty(false);
      return examId;
    } catch (err) {
      toast.error('Failed to save questions: ' + (err instanceof Error ? err.message : 'Unknown error'));
      return null;
    } finally {
      setSavingQuestions(false);
    }
  };

  const handleSaveQuestions = async (): Promise<boolean> => {
    const examId = await persistExamPaper();
    if (!examId) return false;
    toast.success('Questions saved!');
    return true;
  };

  const handleSaveAndGenerateKey = async () => {
    const examId = await persistExamPaper();
    if (!examId) return;

    try {
      const existingExam = exams.find((e) => e.id === examId);
      const result = await publishExamKey(examId, existingExam, details, paperItems);
      toast.success(
        details.is_instant
          ? `Instant Exam live! Key: ${result.key} · PIN: ${result.pin} · 60 min join window`
          : `Exam Key: ${result.key} · PIN: ${result.pin}`
      );
      setCreating(false);
      setEditingExamId(null);
      setSavedExamId(null);
      setStep('details');
      setPaperItems(createInitialPaper());
      setDetails(BLANK_DETAILS);
      fetchExams();
    } catch (err) {
      toast.error('Failed to publish exam: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleEditExam = async (exam: ExamRow) => {
    const scheduled = exam.scheduled_at ? new Date(exam.scheduled_at) : null;
    setDetails({
      title: exam.title,
      subject: exam.subject ?? '',
      batch_ids: exam.batch_ids ?? (exam.batch_id ? [exam.batch_id] : []),
      duration_minutes: exam.duration_minutes,
      scheduled_date: scheduled ? scheduled.toISOString().slice(0, 10) : '',
      scheduled_time: scheduled ? scheduled.toTimeString().slice(0, 5) : '',
      is_instant: exam.is_instant ?? false,
      allow_pyq: exam.allow_pyq ?? false,
      no_reverse_back: exam.no_reverse_back ?? false,
      per_question_time_enabled: !!(exam.per_question_time_seconds),
      per_question_time_seconds: exam.per_question_time_seconds ?? 60,
    });
    setSavedExamId(exam.id);
    setEditingExamId(exam.id);
    await loadQuestionsForExam(exam.id);
    setStep('questions');
    setCreating(true);
  };

  const handleDuplicate = async (exam: ExamRow) => {
    if (!user) return;
    try {
      await duplicateExamService(user.id, exam);
      toast.success('Exam duplicated!');
      fetchExams();
    } catch (err) {
      toast.error('Duplicate failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleArchive = async (exam: ExamRow) => {
    try {
      const status = await toggleArchiveExamService(exam);
      toast.success(status === 'archived' ? 'Exam archived.' : 'Exam restored.');
      fetchExams();
    } catch (err) {
      toast.error('Failed to update status: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleDelete = async (exam: ExamRow) => {
    try {
      await softDeleteExamService(exam.id);
      toast.success('Exam deleted and archived.');
      setActiveModal(null);
      setActiveExam(null);
      fetchExams();
    } catch (err) {
      toast.error('Delete failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleUpdateSettings = async (updates: Partial<ExamDetails>) => {
    if (!activeExam) return;
    try {
      await updateExamSettingsService(activeExam, updates);
      toast.success('Settings updated!');
      setActiveModal(null);
      setActiveExam(null);
      fetchExams();
    } catch (err) {
      toast.error('Update failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const startCreating = () => {
    setDetails(BLANK_DETAILS);
    setPaperItems(createInitialPaper());
    setSavedExamId(null);
    setEditingExamId(null);
    setStep('details');
    setQuestionsDirty(false);
    setCreating(true);
  };

  useEffect(() => {
    if (searchParams.get('import') !== 'questions' || typeof window === 'undefined') return;
    const saved = sessionStorage.getItem('x-pert:pending-question-import');
    if (!saved) return;
    try {
      const imported = JSON.parse(saved) as ExtractedQuestion[];
      if (!Array.isArray(imported) || imported.length === 0) return;
      sessionStorage.removeItem('x-pert:pending-question-import');
      queueMicrotask(() => {
        setDetails(BLANK_DETAILS);
        setPaperItems(paperItemsFromExtracted(imported));
        setSavedExamId(null); setEditingExamId(null); setStep('details'); setQuestionsDirty(true); setCreating(true);
        toast.success('Imported questions are ready. Add exam details, then review them before saving.');
      });
    } catch {
      sessionStorage.removeItem('x-pert:pending-question-import');
      toast.error('The imported question draft could not be opened. Please upload the file again.');
    }
  }, [searchParams]);

  const cancel = () => {
    if (savedExamId && !editingExamId) {
      supabase.from('exams').delete().eq('id', savedExamId).then(() => {});
    }
    setCreating(false);
    setEditingExamId(null);
    setSavedExamId(null);
    setStep('details');
    setPaperItems(createInitialPaper());
    setDetails(BLANK_DETAILS);
    setQuestionsDirty(false);
  };

  const handleUploadImage = async (file: File): Promise<string | null> => {
    setUploadingImg(true);
    try {
      return await uploadExamImage(file);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Image upload failed');
      return null;
    } finally {
      setUploadingImg(false);
    }
  };

  const handleExtractedQuestions = (extracted: ExtractedQuestion[]) => {
    setPaperItems((current) => {
      const imported = paperItemsFromExtracted(extracted);
      const isBlankInitial = current.every((item) => item.itemType === 'section' || !item.question_text);
      return isBlankInitial ? imported : [...current, ...imported];
    });
    setQuestionsDirty(true);
  };

  if (creating) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-gray-900 text-xl font-semibold">
              {editingExamId ? 'Edit Exam' : 'Create New Exam'}
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">Build and schedule your question paper</p>
          </div>
          <button onClick={cancel} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <StepIndicator step={step} />

        {step === 'details' ? (
          <div className="space-y-6">
            <ExamDetailsStep details={details} setDetails={setDetails} batches={batches} />
            <div className="flex items-center justify-between">
              <button onClick={cancel} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
              <button onClick={handleSaveDetails}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                Next: Add Questions
              </button>
            </div>
          </div>
        ) : (
          <ExamQuestionsStep
            title={details.title}
            paperItems={paperItems}
            questionsDirty={questionsDirty}
            savingQuestions={savingQuestions}
            uploadingImg={uploadingImg}
            editingExamId={editingExamId}
            isInstant={details.is_instant}
            onPaperChange={handlePaperChange}
            onUploadImage={handleUploadImage}
            onExtractedQuestions={handleExtractedQuestions}
            onBack={async () => {
              if (questionsDirty) {
                const ok = await handleSaveQuestions();
                if (!ok) return;
              }
              setStep('details');
            }}
            onSaveQuestions={handleSaveQuestions}
            onSaveAndGenerateKey={handleSaveAndGenerateKey}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 text-xl font-semibold">Exams</h2>
          <p className="text-gray-500 text-sm mt-0.5">Manage question papers, keys, and share links</p>
        </div>
        <button onClick={startCreating}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> New Exam
        </button>
      </div>

      {loadingExams ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-gray-900 font-semibold text-lg mb-1">No exams yet</h3>
          <p className="text-gray-500 text-sm mb-6">Create your first exam to share with students</p>
          <button onClick={startCreating}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" /> Create Exam
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onEdit={() => handleEditExam(exam)}
              onSettings={() => { setActiveExam(exam); setActiveModal('settings'); }}
              onPreview={() => { setActiveExam(exam); setActiveModal('preview'); }}
              onDuplicate={() => handleDuplicate(exam)}
              onRegenKey={() => { setActiveExam(exam); setActiveModal('regen-key'); }}
              onViewResults={() => window.location.href = `/teacher/results?exam=${exam.id}`}
              onArchive={() => handleArchive(exam)}
              onDelete={() => { setActiveExam(exam); setActiveModal('confirm-delete'); }}
              onRefresh={fetchExams}
            />
          ))}
        </div>
      )}

      {activeModal === 'settings' && activeExam && (
        <UpdateSettingsModal
          exam={activeExam}
          batches={batches}
          onSave={handleUpdateSettings}
          onClose={() => { setActiveModal(null); setActiveExam(null); }}
        />
      )}

      {activeModal === 'regen-key' && activeExam && (
        <RegenKeyModal
          exam={activeExam}
          onSuccess={() => { setActiveModal(null); setActiveExam(null); fetchExams(); }}
          onClose={() => { setActiveModal(null); setActiveExam(null); }}
        />
      )}

      {activeModal === 'preview' && activeExam && (
        <ExamPreviewModal
          exam={activeExam}
          onClose={() => { setActiveModal(null); setActiveExam(null); }}
        />
      )}

      {activeModal === 'confirm-delete' && activeExam && (
        <ExamDeleteConfirmModal
          exam={activeExam}
          onConfirm={() => handleDelete(activeExam)}
          onClose={() => { setActiveModal(null); setActiveExam(null); }}
        />
      )}
    </div>
  );
}
