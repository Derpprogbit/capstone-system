// FILE: src/app/login/page.js
// PURPOSE: Student & Admin login and open registration page (no dummy accounts).

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [section, setSection] = useState('BSIT 3-A');
  const [track, setTrack] = useState('Networking & Infrastructure');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Handles both Sign In and New Account Registration
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (isRegister) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, section, track } },
      });
      setLoading(false);
      if (error) return setMessage(error.message);
      setMessage('Account created! You can now sign in (or check your email if confirmation is enabled).');
      setIsRegister(false);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return setMessage(error.message);
      router.push('/');
    }
  }

  return (
    <div className="max-w-md mx-auto my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-5">
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-[#0F4C25] dark:text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" /> GUAGUA NATIONAL COLLEGES • BSIT
        </span>
        <h1 className="text-xl font-bold">{isRegister ? 'Create Student Account' : 'Sign In to Knowledge Bridge'}</h1>
      </div>

      {/* Tabs to switch between Sign In and Register */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button type="button" onClick={() => setIsRegister(false)} className={`pb-2.5 pr-5 border-b-2 ${!isRegister ? 'border-[#0F4C25] text-[#0F4C25]' : 'border-transparent text-slate-500'}`}>Sign In</button>
        <button type="button" onClick={() => setIsRegister(true)} className={`pb-2.5 px-5 border-b-2 ${isRegister ? 'border-[#0F4C25] text-[#0F4C25]' : 'border-transparent text-slate-500'}`}>Register</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {isRegister && (
          <>
            <div>
              <label className="block font-semibold mb-1">Full Name</label>
              {/* Input for student's full name */}
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Luigi Cocjin" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Year & Section</label>
                {/* Selector for BSIT year and section */}
                <select value={section} onChange={(e) => setSection(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                  <option>BSIT 1-A</option><option>BSIT 2-A</option><option>BSIT 3-A</option><option>BSIT 4-A</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">IT Track</label>
                {/* Selector for primary IT specialization */}
                <select value={track} onChange={(e) => setTrack(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                  <option>Networking & Infrastructure</option><option>Web UI & Full-Stack Dev</option><option>Software Engineering</option><option>Game Development</option>
                </select>
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block font-semibold mb-1">Email Address</label>
          {/* Input for user email */}
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
        </div>

        <div>
          <label className="block font-semibold mb-1">Password</label>
          {/* Input for account password */}
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
        </div>

        {message && <p className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">{message}</p>}

        {/* Submit button for Login or Registration */}
        <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-[#0F4C25] hover:bg-[#0A361A] text-white font-semibold">
          {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}