// FILE: src/components/Navbar.js
// PURPOSE: Top desktop bar, mobile bottom bar, GNC seal, theme toggle, and profile menu.

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageSquareCode, BookOpenCheck, Landmark, Sun, Moon, User, LayoutDashboard, Settings, LogOut } from 'lucide-react';

export default function Navbar({ profile, dark, onToggleTheme }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Signs the user out and returns to the login page
  async function handleLogout() {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push('/login');
  }

  const navItems = [
    { href: '/', label: 'Home', icon: MessageSquareCode },
    { href: '/subjects', label: 'Subjects', icon: BookOpenCheck },
    { href: '/about', label: 'About', icon: Landmark },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: GNC Seal + System Title */}
          <Link href="/" className="flex items-center gap-3">
            {!logoError ? (
              <img src="/gnc-logo.png" alt="GNC Seal" onError={() => setLogoError(true)} className="w-9 h-9 rounded-full object-contain" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#0F4C25] border-2 border-[#C59B27] text-white font-bold text-xs flex items-center justify-center">GNC</div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base tracking-tight">Knowledge Bridge</span>
                <span className="hidden sm:inline px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-[#0F4C25]/10 text-[#0F4C25] dark:text-emerald-400 border border-[#0F4C25]/25">BSIT</span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Guagua National Colleges</p>
            </div>
          </Link>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                    active ? 'bg-[#0F4C25]/10 text-[#0F4C25] dark:text-emerald-400 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}>
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Theme Toggle & Profile Dropdown */}
          <div className="flex items-center gap-2">
            {/* Button to toggle Light / Dark theme */}
            <button onClick={onToggleTheme} aria-label="Toggle Theme" className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
              {dark ? <Sun className="w-4 h-4 text-[#C59B27]" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {profile ? (
              <div className="relative">
                {/* Button to open Profile menu */}
                <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <div className={`w-7 h-7 rounded-md text-white text-xs font-bold flex items-center justify-center ${profile.role === 'admin' ? 'bg-[#A31D1D]' : 'bg-[#0F4C25]'}`}>
                    {profile.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold">{profile.full_name}</span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1.5 z-50 text-xs">
                    <Link href="/profile?tab=profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"><User className="w-3.5 h-3.5" /> My Profile</Link>
                    <Link href="/profile?tab=dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"><LayoutDashboard className="w-3.5 h-3.5" /> Dashboard</Link>
                    <Link href="/profile?tab=settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"><Settings className="w-3.5 h-3.5" /> Settings & Theme</Link>
                    <hr className="my-1 border-slate-200 dark:border-slate-700" />
                    <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-3.5 py-2 text-[#A31D1D] hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold"><LogOut className="w-3.5 h-3.5" /> Log Out</button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="px-3.5 py-2 rounded-lg bg-[#0F4C25] hover:bg-[#0A361A] text-white text-xs font-semibold">Sign In</Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center gap-1 text-[11px] ${active ? 'text-[#0F4C25] dark:text-emerald-400 font-semibold' : 'text-slate-500'}`}>
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <Link href={profile ? '/profile?tab=dashboard' : '/login'} className="flex flex-col items-center justify-center gap-1 text-[11px] text-slate-500">
          <User className="w-4 h-4" />
          <span>{profile ? 'Profile' : 'Sign In'}</span>
        </Link>
      </nav>
    </>
  );
}