import type { QuestionType, QuestionItem, SectionItem, PaperItem } from '../types/paper-builder.types';

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function blankQuestion(
  type: QuestionType,
  sectionId: string | null,
  section?: SectionItem | null,
): QuestionItem {
  return {
    id: uid(),
    itemType: 'question',
    sectionId,
    question_type: type,
    question_text: '',
    question_image: null,
    options: type === 'mcq' ? [{ text: '', imageUrl: null }, { text: '', imageUrl: null }] : [],
    correct_answer: '',
    positive_marks: section?.positive_marks ?? 1,
    negative_marks: section?.negative_marks ?? 0,
    difficulty: 'medium',
    is_pyq: false,
  };
}

export function blankSection(): SectionItem {
  return { id: uid(), itemType: 'section', title: 'Section Title', positive_marks: 1, negative_marks: 0 };
}

export function questionsToPaperItems(rows: {
  id: string; question_text: string; question_image?: string | null;
  question_type: QuestionType; options?: string[] | null; option_images?: (string | null)[] | null;
  correct_answer?: string | null; positive_marks?: number; negative_marks?: number;
  difficulty?: string | null; is_pyq?: boolean; section_title?: string | null; order_index?: number;
}[]): PaperItem[] {
  const items: PaperItem[] = [];
  let lastSectionTitle: string | null = null;
  let lastSectionId: string | null = null;

  for (const q of rows) {
    if (q.section_title && q.section_title !== lastSectionTitle) {
      lastSectionTitle = q.section_title;
      lastSectionId = uid();
      items.push({
        id: lastSectionId, itemType: 'section', title: q.section_title,
        positive_marks: q.positive_marks ?? 1, negative_marks: q.negative_marks ?? 0,
      });
    }
    items.push({
      id: uid(), itemType: 'question', dbId: q.id, sectionId: lastSectionId,
      question_type: q.question_type,
      question_text: q.question_text,
      question_image: q.question_image ?? null,
      options: (q.options ?? []).map((text, i) => ({ text, imageUrl: q.option_images?.[i] ?? null })),
      correct_answer: q.correct_answer ?? '',
      positive_marks: q.positive_marks ?? 1,
      negative_marks: q.negative_marks ?? 0,
      difficulty: (q.difficulty ?? 'medium') as QuestionItem['difficulty'],
      is_pyq: q.is_pyq ?? false,
    });
  }
  return items.length > 0 ? items : [blankQuestion('mcq', null)];
}

export function getQuestionsFromItems(items: PaperItem[]): QuestionItem[] {
  return items.filter((i) => i.itemType === 'question') as QuestionItem[];
}
