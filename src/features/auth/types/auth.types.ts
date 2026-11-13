export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'teacher' | 'student' | 'parent';
  phone?: string | null;
  avatar_url?: string | null;
}

export interface AuthError {
  message: string;
  status?: number;
}
