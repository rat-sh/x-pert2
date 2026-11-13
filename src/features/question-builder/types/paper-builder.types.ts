export type QuestionType = 'mcq' | 'true_false' | 'numerical' | 'theoretical';

export interface DraftOption {
  text: string;
  imageUrl: string | null;
}

export interface PaperItemBase {
  id: string;
  itemType: 'section' | 'question';
}

export interface SectionItem extends PaperItemBase {
  itemType: 'section';
  title: string;
  positive_marks: number;
  negative_marks: number;
}

export interface QuestionItem extends PaperItemBase {
  itemType: 'question';
  dbId?: string;
  sectionId: string | null;
  question_type: QuestionType;
  question_text: string;
  question_image: string | null;
  options: DraftOption[];
  correct_answer: string;
  positive_marks: number;
  negative_marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  is_pyq: boolean;
}

export type PaperItem = SectionItem | QuestionItem;
