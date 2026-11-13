import { supabase } from '@/shared/services/supabase-client';

/**
 * signUpStudent
 *
 * Creates a new Supabase auth user with role='student'.
 */
export async function signUpStudent(params: {
  fullName: string;
  email: string;
  password: string;
}) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const { data, error } = await supabase.auth.signUp({
    email: params.email.trim(),
    password: params.password,
    options: {
      emailRedirectTo: `${origin}/login`,
      data: {
        full_name: params.fullName.trim(),
        role: 'student',
      },
    },
  });

  return { data, error };
}
