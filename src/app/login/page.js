/**
 * FILE: src/app/login/page.js
 * ROUTE: /login
 * PURPOSE: Unified Sign In & Register page. Registration creates both a
 *          Supabase Auth user and a matching row in public.profiles with zero
 *          email or LRN domain restrictions.
 * DATA FLOW:
 *   • Sign In mode: calls supabase.auth.signInWithPassword({ email, password }),
 *     then redirects to / on success.
 *   • Register mode: calls supabase.auth.signUp({ email, password, options }),
 *     then upserts a matching row into public.profiles with the auth user's id,
 *     then redirects to /.
 * USED BY / CALLED BY: Navbar Sign In button, unauthenticated users.
 * TROUBLESHOOT: If registration succeeds in Auth but fails in public.profiles,
 *               verify schema.sql was run and RLS is disabled on profiles. If
 *               Supabase is not configured, check .env.local for
 *               NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus, AlertCircle } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  // [STEP 1 - FLOW: Holds the current auth mode: "signin" or "register".
  //  Toggled by clicking the Sign In / Register tab buttons.]
  const [mode, setMode] = useState("signin"); // 'signin' | 'register'
  // [STEP 2 - FLOW: Holds the full name entered during registration (register
  //  mode only). Used when creating the public.profiles row.]
  const [fullName, setFullName] = useState("");
  // [STEP 3 - FLOW: Holds the email address entered for sign in or register.
  //  Submitted to Supabase Auth on form submit.]
  const [email, setEmail] = useState("");
  // [STEP 4 - FLOW: Holds the password entered for sign in or register.
  //  Submitted to Supabase Auth on form submit.]
  const [password, setPassword] = useState("");
  // [STEP 5 - FLOW: Boolean flag set to true while an auth request is in
  //  flight, used to disable the submit button.]
  const [loading, setLoading] = useState(false);
  // [STEP 6 - FLOW: Holds error messages to display below the form header.
  //  Set by handleSubmit on failure or when Supabase is not configured.]
  const [errorMsg, setErrorMsg] = useState("");
  // [STEP 7 - FLOW: Holds success messages to display below the form header.
  //  Set by handleSubmit on successful registration.]
  const [successMsg, setSuccessMsg] = useState("");

  // [STEP 8 - FLOW (handler): Handles Sign In or Register with Supabase Auth +
  //  public.profiles. In signin mode, calls signInWithPassword and redirects to
  //  /. In register mode, validates full name, calls signUp, then upserts a
  //  matching profile row into public.profiles and redirects to /.]
  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!isSupabaseConfigured) {
      setErrorMsg(
        "Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local."
      );
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        // [DATA CALL: supabase.auth.signInWithPassword({ email, password })
        //  — talks to Supabase Auth. Signs the user in with email/password.
        //  Expects success (no error) on valid credentials.]
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        router.push("/");
        router.refresh();
      } else {
        if (!fullName.trim()) {
          throw new Error("Full Name is required to register.");
        }
        // [STEP 9 - FLOW: Create Supabase Auth user via signUp.]
        // [DATA CALL: supabase.auth.signUp({ email, password, options })
        //  — talks to Supabase Auth. Creates a new Auth user with email/password
        //  and stores full_name in user metadata. Expects { data: { user } }
        //  on success.]
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
          },
        });
        if (authError) throw authError;

        // [STEP 10 - FLOW: Create matching row in public.profiles.]
        // [DATA CALL: supabase.from("profiles").upsert([{ id, full_name, email,
        //  role }]) — talks to public.profiles. Inserts or updates a profile row
        //  keyed by the auth user's id. Expects no error on success.]
        if (authData?.user) {
          const { error: profileError } = await supabase.from("profiles").upsert([
            {
              id: authData.user.id,
              full_name: fullName.trim(),
              email: email.trim(),
              role: "student",
            },
          ]);
          if (profileError) throw profileError;
        }

        setSuccessMsg("Account created! Redirecting to the Peer Commons...");
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setErrorMsg(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 sm:mt-14 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
      <div className="text-center mb-6">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#0F4C25]/10 text-[#0F4C25] dark:bg-[#0F4C25]/30 dark:text-emerald-300 mb-2">
          GNC BSIT Peer Commons
        </span>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {mode === "signin" ? "Sign In to Knowledge Breach" : "Create Student Account"}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {mode === "signin"
            ? "Access study threads, team recruitment, and peer DMs."
            : "Join the BSIT peer network with any valid email address."}
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 mb-6">
        {/* [UI ELEMENT: SIGN IN TAB BUTTON — clicking sets mode to "signin",
         *  clears error messages, and switches the form to sign-in view.] */}
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setErrorMsg("");
          }}
          className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
            mode === "signin"
              ? "bg-white dark:bg-slate-900 text-[#0F4C25] dark:text-[#C59B27] shadow-xs"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          Sign In
        </button>

        {/* [UI ELEMENT: REGISTER TAB BUTTON — clicking sets mode to "register",
         *  clears error messages, and switches the form to registration view
         *  (showing the Full Name input).] */}
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setErrorMsg("");
          }}
          className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
            mode === "register"
              ? "bg-white dark:bg-slate-900 text-[#0F4C25] dark:text-[#C59B27] shadow-xs"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          Register
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-[#A31D1D]/30 text-xs text-[#A31D1D] dark:text-red-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-[#0F4C25]/30 text-xs text-[#0F4C25] dark:text-emerald-300">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            {/* [UI ELEMENT: FULL NAME INPUT — visible only in register mode.
             *  Typing updates fullName state via setFullName. Required field
             *  used when creating the public.profiles row on registration.] */}
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Juan Dela Cruz"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0F4C25]"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Email Address
          </label>
          {/* [UI ELEMENT: EMAIL INPUT — typing updates email state via setEmail.
           *  Required field submitted to Supabase Auth on sign in or register.] */}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0F4C25]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Password
          </label>
          {/* [UI ELEMENT: PASSWORD INPUT — typing updates password state via
           *  setPassword. Required field (min 6 chars) submitted to Supabase
           *  Auth on sign in or register.] */}
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0F4C25]"
          />
        </div>

        {/* [UI ELEMENT: AUTH SUBMIT BUTTON — clicking submits the form via
         *  handleSubmit. In signin mode calls supabase.auth.signInWithPassword;
         *  in register mode calls signUp then upserts into public.profiles.
         *  Disabled while loading.] */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#0F4C25] hover:bg-[#0b3a1c] text-white text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {mode === "signin" ? (
            <>
              <LogIn className="w-4 h-4" />
              {loading ? "Signing In..." : "Sign In"}
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              {loading ? "Creating Account..." : "Create Account"}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
