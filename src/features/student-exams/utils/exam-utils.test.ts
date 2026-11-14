import { describe, expect, it } from 'vitest';
import { calculateRemainingSeconds, countAnswered } from './exam-utils';

describe('calculateRemainingSeconds', () => {
  it('uses the server clock offset and floors to whole seconds', () => {
    expect(calculateRemainingSeconds(120_750, 100_000, 500)).toBe(20);
  });

  it('never returns a negative value', () => {
    expect(calculateRemainingSeconds('2025-01-01T00:00:00Z', Date.parse('2025-01-01T00:00:01Z'), 0)).toBe(0);
  });
});

describe('countAnswered', () => {
  it('counts only non-blank answers', () => {
    expect(countAnswered({ one: ' A ', two: '', three: '   ', four: '0' })).toBe(2);
  });
});
