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
  const origin = (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim() !== '')
    ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
    : (typeof window !== 'undefined' ? window.location.origin : '');

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

  if (error) {
    return { data: null, error };
  }

  // If Supabase returns empty identities, this email is already registered
  if (data?.user?.identities && data.user.identities.length === 0) {
    return {
      data: null,
      error: new Error('An account with this email already exists. Please sign in.'),
    };
  }

  return { data, error: null };
}
