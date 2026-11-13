export type ID = string;

export interface PageProps<Params = Record<string, string>, Search = Record<string, string>> {
  params: Params;
  searchParams?: Search;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export type UserRole = 'teacher' | 'student' | 'parent';
