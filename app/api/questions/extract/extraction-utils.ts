import { z } from 'zod';

const ExtractedQuestionSchema = z.object({
  question_text: z.string().trim().min(1).max(10_000),
  question_type: z.enum(['mcq', 'true_false', 'numerical', 'theoretical']),
  options: z.array(z.string().trim().min(1).max(2_000)).max(20),
  correct_answer: z.string().trim().max(4_000),
  marks: z.number().finite().positive().max(1_000),
  positive_marks: z.number().finite().positive().max(1_000),
  negative_marks: z.number().finite().nonnegative().max(1_000),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  chapter_tag: z.string().trim().max(500).optional(),
  section_title: z.string().trim().max(500).optional(),
});

export type ExtractedQuestion = z.infer<typeof ExtractedQuestionSchema>;

export function parseQuestionsJson(input: string): { questions: ExtractedQuestion[]; partial: boolean } | null {
  try {
    return normalizeQuestions(JSON.parse(input));
  } catch {
    return null;
  }
}

export function normalizeQuestions(value: unknown): { questions: ExtractedQuestion[]; partial: boolean } {
  if (!Array.isArray(value)) return { questions: [], partial: true };

  let partial = value.length > 200;
  const questions: ExtractedQuestion[] = [];

  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      partial = true;
      continue;
    }

    const candidate = item as Record<string, unknown>;
    const marks = candidate.marks === undefined ? 1 : candidate.marks;
    const normalized = ExtractedQuestionSchema.safeParse({
      question_text: candidate.question_text,
      question_type: candidate.question_type === undefined ? 'mcq' : candidate.question_type,
      options: candidate.options === undefined ? [] : candidate.options,
      correct_answer: candidate.correct_answer === undefined ? '' : candidate.correct_answer,
      marks,
      positive_marks: candidate.positive_marks === undefined ? marks : candidate.positive_marks,
      negative_marks: candidate.negative_marks === undefined ? 0 : candidate.negative_marks,
      difficulty: candidate.difficulty === undefined ? 'medium' : candidate.difficulty,
      chapter_tag: candidate.chapter_tag,
      section_title: candidate.section_title,
    });

    if (!normalized.success) {
      partial = true;
      continue;
    }
    if (!normalized.data.correct_answer) partial = true;
    if (questions.length < 200) questions.push(normalized.data);
  }

  return { questions, partial };
}

export function hasSupportedMagicBytes(mimeType: string, bytes: Uint8Array): boolean {
  if (mimeType === 'application/pdf') {
    return bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d;
  }
  if (mimeType === 'image/png') {
    return bytes.length >= 8
      && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
      && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  }
  if (mimeType === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  }
  return false;
}

export function createUserRateLimiter() {
  const requestsByUser = new Map<string, number[]>();

  return (userId: string, now = Date.now()): boolean => {
    const dayAgo = now - 24 * 60 * 60 * 1_000;
    const recent = (requestsByUser.get(userId) ?? []).filter((requestAt) => requestAt > dayAgo);
    const tenMinutesAgo = now - 10 * 60 * 1_000;
    const recentWindowCount = recent.filter((requestAt) => requestAt > tenMinutesAgo).length;

    if (recentWindowCount >= 5 || recent.length >= 30) {
      requestsByUser.set(userId, recent);
      return false;
    }

    recent.push(now);
    requestsByUser.set(userId, recent);
    return true;
  };
}

// This process-local limiter is intentionally instance-local; it is not shared across server instances.
export const consumeExtractionRequest = createUserRateLimiter();
