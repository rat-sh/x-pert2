import { supabase } from '@/shared/services/supabase-client';
import type { SignupInput } from '@/features/auth/schemas/auth.schema';

/**
 * auth.service.ts
 *
 * All Supabase auth operations. No UI concerns here.
 */

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signUp(input: SignupInput) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/login`,
      data: {
        full_name: input.full_name,
        role: 'teacher',
        phone: input.phone ?? null,
      },
    },
  });

  if (authError || !authData.user) {
    return { data: null, error: authError };
  }

  // If we have an immediate session (email confirmation disabled), update teacher profile
  if (authData.session && input.subject) {
    await supabase.from('teachers').update({
      institution_name: `Subject: ${input.subject}`,
    }).eq('id', authData.user.id);
  }

  return { data: authData, error: null };
}

export async function signOut() {
  return supabase.auth.signOut();
}

/**
 * Sends a password reset email via Supabase.
 * Redirects to /login?reset=true after the user clicks the link.
 */
export async function resetPassword(email: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/login?reset=true`,
  });
  return { data, error };
}

/**
 * Updates the user's password using the current recovery session.
 */
export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { data, error };
}

/**
 * Fetches the UserProfile row from the `users` table for the given userId.
 */
export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}
