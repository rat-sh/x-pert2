export type ExtractedQuestion = {
  question_text: string;
  question_type: 'mcq' | 'true_false' | 'numerical' | 'theoretical';
  options: string[];
  correct_answer: string;
  marks: number;
  positive_marks: number;
  negative_marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  chapter_tag?: string;
  section_title?: string;
};
