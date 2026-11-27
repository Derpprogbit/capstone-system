/**
 * FILE: src/lib/supabase.js
 * ROUTE: Shared library module (not a page or API route)
 * PURPOSE: Reusable Supabase client connection with safe fallback check when
 *          environment variables are not yet configured. Exports a configured
 *          supabase client and an isSupabaseConfigured boolean flag.
 * DATA FLOW: Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 *            from environment variables. Falls back to placeholder values if
 *            missing so the app can still build. isSupabaseConfigured gates all
 *            Supabase calls across the app.
 * USED BY / CALLED BY: All API routes (src/app/api/*) and all client pages/
 *                      components that call supabase.auth, supabase.from, etc.
 * TROUBLESHOOT: Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 *               are set in .env.local. If missing, isSupabaseConfigured is false
 *               and all Supabase calls are skipped gracefully.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xcuvryrfsfzneqmnvoki.supabase.co      ";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_cEMJ0DRqdWgyE7-34z4VrA_lJwScRi7";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("http")
);

// [STEP 1 - FLOW: Initialize Supabase client with safe placeholder fallback for build-time safety.
//  If env vars are missing, uses placeholder URL/key so the module imports cleanly
//  during Next.js build; all runtime calls are guarded by isSupabaseConfigured.]
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : "https://placeholder.supabase.co",
  isSupabaseConfigured ? supabaseAnonKey : "placeholder-anon-key"
);
