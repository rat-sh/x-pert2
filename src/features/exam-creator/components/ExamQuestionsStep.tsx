import { ChevronLeft, Save, Key } from 'lucide-react';
import { PaperItem, getQuestionsFromItems, QuestionPaperBuilder } from '@/features/question-builder/components/QuestionPaperBuilder';
import { QuestionExtractionUpload, ExtractedQuestion } from '@/features/question-extraction/components/QuestionExtractionUpload';

interface ExamQuestionsStepProps {
  title: string;
  paperItems: PaperItem[];
  questionsDirty: boolean;
  savingQuestions: boolean;
  uploadingImg: boolean;
  editingExamId: string | null;
  isInstant: boolean;
  onPaperChange: (items: PaperItem[]) => void;
  onUploadImage: (file: File) => Promise<string | null>;
  onExtractedQuestions: (extracted: ExtractedQuestion[]) => void;
  onBack: () => Promise<void>;
  onSaveQuestions: () => Promise<boolean>;
  onSaveAndGenerateKey: () => Promise<void>;
}

export function ExamQuestionsStep({
  title,
  paperItems,
  questionsDirty,
  savingQuestions,
  uploadingImg,
  editingExamId,
  isInstant,
  onPaperChange,
  onUploadImage,
  onExtractedQuestions,
  onBack,
  onSaveQuestions,
  onSaveAndGenerateKey,
}: ExamQuestionsStepProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-gray-900 font-semibold text-lg">
              {title || 'Question Paper'}
            </h3>
            <p className="text-gray-500 text-sm mt-0.5">Add sections and multiple questions — save when ready</p>
          </div>
          {questionsDirty && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">Unsaved changes</span>
          )}
        </div>
        <div className="p-4">
          <div className="mb-4">
            <QuestionExtractionUpload onExtracted={onExtractedQuestions} />
          </div>
          <QuestionPaperBuilder
            items={paperItems}
            onChange={onPaperChange}
            onUploadImage={onUploadImage}
            uploading={uploadingImg}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onSaveQuestions}
            disabled={savingQuestions}
            className="flex items-center gap-2 px-5 py-2.5 border border-indigo-300 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" /> {savingQuestions ? 'Saving…' : 'Save Questions'}
          </button>
          <button
            onClick={onSaveAndGenerateKey}
            disabled={getQuestionsFromItems(paperItems).length === 0 || savingQuestions}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Key className="w-4 h-4" /> {editingExamId ? 'Save & Republish' : isInstant ? 'Publish Instant Exam' : 'Save & Generate Key'}
          </button>
        </div>
      </div>
    </div>
  );
}
