import type { UserProfile, UserRole } from '@/shared/types/database.types';

export type { UserRole };
export type { UserProfile };

export interface TeacherProfile extends UserProfile {
  role: 'teacher';
}

export interface StudentProfile extends UserProfile {
  role: 'student';
}
