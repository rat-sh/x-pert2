export function formatScore(score: number, total: number): string {
  return `${score}/${total}`;
}

export function calculatePercentage(score: number, total: number): number {
  if (!total) return 0;
  return Math.round((score / total) * 100);
}

export function formatMarks(marks: number): string {
  return marks % 1 === 0 ? String(marks) : marks.toFixed(2);
}
