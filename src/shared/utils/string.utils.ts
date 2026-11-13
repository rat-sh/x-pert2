/**
 * string.utils.ts
 * Pure string helper functions shared across all features.
 */

/** Truncates a string to maxLen characters, appending "…" if needed. */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + '…';
}

/** Capitalizes the first letter of a string. */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/** Generates a random alphanumeric code of a given length. */
export function generateCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/** Strips leading/trailing whitespace and collapses inner whitespace. */
export function normalizeWhitespace(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}
