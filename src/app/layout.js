/**
 * FILE: src/app/layout.js
 * ROUTE: Root layout (wraps all pages via Next.js App Router)
 * PURPOSE: Root application layout with persistent Navbar, Light/Dark theme
 *          initialization from localStorage, and Supabase auth session listener.
 *          Provides user and profile context to all child pages via props.
 * DATA FLOW:
 *   • On mount, reads kb_theme from localStorage and toggles .dark on <html>.
 *   • Calls supabase.auth.getSession() to load the current user and their
 *     matching public.profiles row.
 *   • Subscribes to supabase.auth.onAuthStateChange to react to sign-in/sign-out
 *     across the app, updating user/profile state and re-fetching the profile.
 * USED BY / CALLED BY: Next.js App Router (wraps all pages). Passes user and
 *                      profile down to Navbar and all page components.
 * TROUBLESHOOT: If auth state doesn't persist across reloads, check
 *               supabase.auth.onAuthStateChange and .env.local keys. If profile
 *               is null after sign-in, verify schema.sql was executed and RLS
 *               is disabled on public.profiles.
 */

"use client";

import { useState, useEffect } from "react";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function RootLayout({ children }) {
  // [STEP 1 - FLOW: Holds the authenticated Supabase Auth user object (or null).
  //  Set by getSession on mount and by onAuthStateChange on sign-in/sign-out.]
  const [user, setUser] = useState(null);
  // [STEP 2 - FLOW: Holds the matching public.profiles row for the current user
  //  (or null). Fetched from Supabase after the user session is resolved.]
  const [profile, setProfile] = useState(null);

  // [STEP 3 - FLOW (useEffect): Initialize Light/Dark theme from localStorage on
  //  mount. Reads "kb_theme"; if "dark", adds .dark class to documentElement,
  //  otherwise removes it. Tailwind @custom-variant dark then applies dark-mode
  //  styles throughout the app.]
  useEffect(() => {
    const savedTheme = localStorage.getItem("kb_theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // [STEP 4 - FLOW (useEffect): Listen to Supabase auth session and fetch matching
  //  public.profiles row. On mount calls getSession to bootstrap user + profile.
  //  Then subscribes to onAuthStateChange to keep user/profile in sync on every
  //  auth event (sign in, sign out, token refresh). Returns an unsubscribe
  //  cleanup function on unmount.]
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    async function loadSession() {
      // [DATA CALL: supabase.auth.getSession() — talks to Supabase Auth to retrieve
      //  the current session. Expects { data: { session: { user, ... } } }.]
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // [DATA CALL: supabase.from("profiles").select("*").eq("id", ...).single()
        //  — talks to public.profiles table. Expects a single profile row matching
        //  the authenticated user's id.]
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();
        setProfile(data || null);
      } else {
        setProfile(null);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();
        setProfile(data || null);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <head>
        <title>Knowledge Breach | GNC BSIT Peer Commons</title>
        <meta
          name="description"
          content="Guagua National Colleges BSIT Peer Commons for study resources, team recruitment, and peer mentorship."
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16 md:pb-0">
        <Navbar user={user} profile={profile} />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
