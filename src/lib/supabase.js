// FILE: src/lib/supabase.js
// PURPOSE: Connects the app to Supabase using public environment variables.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Browser client used across components
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server helper: verifies the user's login token inside /api/* routes so IDs cannot be faked
export async function getAuthUser(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return { user: null, db: supabase };

  // Create a scoped client carrying the user's JWT so Postgres RLS applies automatically
  const scopedClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await scopedClient.auth.getUser(token);
  if (error || !data?.user) return { user: null, db: scopedClient };
  return { user: data.user, db: scopedClient };
}