// Server-side Supabase client for React Server Components
// Uses direct env vars (no browser client) — safe for server-only use.
import { createClient } from '@supabase/supabase-js';

export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder';
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
