import { describe, expect, it } from 'vitest';
import {
  createUserRateLimiter,
  hasSupportedMagicBytes,
  normalizeQuestions,
  parseQuestionsJson,
} from './extraction-utils';

describe('question extraction normalization', () => {
  it('returns null for malformed JSON', () => {
    expect(parseQuestionsJson('{bad json')).toBeNull();
  });

  it('rejects a non-array top-level value', () => {
    expect(parseQuestionsJson('{"question_text":"not an array"}')).toEqual({ questions: [], partial: true });
  });

  it('drops rows with invalid field types and marks the response partial', () => {
    const result = normalizeQuestions([
      { question_text: 42, question_type: 'mcq', options: [], marks: 1 },
      { question_text: 'A valid row', question_type: 'mcq', options: [], marks: '2' },
      { question_text: 'Valid', question_type: 'short_answer', options: [], marks: 1 },
    ]);

    expect(result.questions).toEqual([]);
    expect(result.partial).toBe(true);
  });

  it('caps valid output at 200 questions', () => {
    const result = normalizeQuestions(Array.from({ length: 205 }, (_, index) => ({
      question_text: `Question ${index}`,
      question_type: 'mcq',
      options: ['A', 'B'],
      correct_answer: 'A',
      marks: 1,
    })));

    expect(result.questions).toHaveLength(200);
    expect(result.partial).toBe(true);
  });

  it('enforces per-user rolling ten-minute and daily request limits', () => {
    const allow = createUserRateLimiter();
    for (let request = 0; request < 5; request += 1) {
      expect(allow('teacher-a', request)).toBe(true);
    }
    expect(allow('teacher-a', 5)).toBe(false);
    expect(allow('teacher-b', 5)).toBe(true);

    const dailyAllow = createUserRateLimiter();
    for (let request = 0; request < 30; request += 1) {
      expect(dailyAllow('teacher-c', request * 600_001)).toBe(true);
    }
    expect(dailyAllow('teacher-c', 30 * 600_001)).toBe(false);
  });

  it('checks file signatures against the declared MIME type', () => {
    expect(hasSupportedMagicBytes('application/pdf', new TextEncoder().encode('%PDF-1.7'))).toBe(true);
    expect(hasSupportedMagicBytes('image/png', new TextEncoder().encode('%PDF-1.7'))).toBe(false);
    expect(hasSupportedMagicBytes('application/vnd.openxmlformats-officedocument.wordprocessingml.document', new Uint8Array([0x50, 0x4b, 0x03, 0x04]))).toBe(true);
  });
});
