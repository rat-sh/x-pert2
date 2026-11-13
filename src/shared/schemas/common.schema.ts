import { z } from 'zod';

export const uuidSchema = z.string().uuid();
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');
export const emailSchema = z.string().email('Enter a valid email address');
export const nonEmptyString = (msg?: string) => z.string().min(1, msg ?? 'This field is required');
