// FILE: src/app/layout.js
// PURPOSE: Root wrapper that keeps the Navbar visible and applies saved Light/Dark mode.

'use client';

import './globals.css';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';

export default function RootLayout({ children }) {
  // Stores the logged-in user's profile and session token
  const [profile, setProfile] = useState(null);
  const [dark, setDark] = useState(false);

  // Load saved Dark Mode preference on startup
  useEffect(() => {
    const savedTheme = localStorage.getItem('kb_theme');
    if (savedTheme === 'dark') {
      setDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Listen to Supabase login/logout changes
  useEffect(() => {
    async function loadProfile(userId) {
      if (!userId) return setProfile(null);
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      setProfile(data || null);
    }

    supabase.auth.getSession().then(({ data }) => loadProfile(data?.session?.user?.id));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      loadProfile(session?.user?.id);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Toggle between Light and Dark mode and save to localStorage
  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('kb_theme', next ? 'dark' : 'light');
  }

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 pb-16 md:pb-0">
        <Navbar profile={profile} dark={dark} onToggleTheme={toggleTheme} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
      </body>
    </html>
  );
}