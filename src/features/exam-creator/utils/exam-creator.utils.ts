import { ExtractedQuestion } from '@/features/question-extraction/components/QuestionExtractionUpload';
import { PaperItem, SectionItem, blankQuestion, blankSection } from '@/features/question-builder/components/QuestionPaperBuilder';

export function generateKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  return 'EXM' + Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function statusBadge(status: string | undefined): { label: string; className: string } {
  switch (status) {
    case 'scheduled': return { label: 'Scheduled', className: 'bg-indigo-100 text-indigo-700' };
    case 'active':    return { label: 'Active',    className: 'bg-green-100 text-green-700' };
    case 'completed': return { label: 'Completed', className: 'bg-purple-100 text-purple-700' };
    case 'archived':  return { label: 'Archived',  className: 'bg-gray-100 text-gray-500' };
    default:          return { label: 'Draft',     className: 'bg-gray-100 text-gray-600' };
  }
}

export function createInitialPaper(): PaperItem[] {
  const section = { ...blankSection(), title: 'Section 1' };
  return [section, blankQuestion('mcq', section.id, section)];
}

export function paperItemsFromExtracted(questions: ExtractedQuestion[]): PaperItem[] {
  const items: PaperItem[] = [];
  let activeSection: SectionItem | null = null;
  let activeTitle = '';

  for (const question of questions) {
    const title = question.section_title?.trim() || 'Questions';
    if (title !== activeTitle) {
      activeTitle = title;
      activeSection = { ...blankSection(), title, positive_marks: question.positive_marks, negative_marks: question.negative_marks };
      items.push(activeSection);
    }
    items.push({
      ...blankQuestion(question.question_type, activeSection?.id ?? null, activeSection),
      question_text: question.question_text,
      options: question.question_type === 'mcq' ? question.options.map((text) => ({ text, imageUrl: null })) : [],
      correct_answer: question.correct_answer,
      positive_marks: question.positive_marks,
      negative_marks: question.negative_marks,
      difficulty: question.difficulty,
    });
  }
  return items.length ? items : createInitialPaper();
}
