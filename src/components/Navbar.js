/**
 * FILE: src/components/Navbar.js
 * ROUTE: Client component (used by all pages via RootLayout)
 * PURPOSE: Persistent responsive navigation bar (desktop top nav + mobile bottom nav)
 *          with GNC brand logo (/gnc-logo.png + fallback badge), Home, IT Subjects,
 *          About links, and Profile dropdown (My Profile, Dashboard, Settings & Theme,
 *          Log Out) or Sign In button.
 * DATA FLOW:
 *   • Receives user and profile props from RootLayout (set by Supabase auth listener).
 *   • Clicking Sign In navigates to /login. Clicking profile dropdown shows options.
 *   • Clicking Log Out calls supabase.auth.signOut() and redirects to /login.
 * USED BY / CALLED BY: RootLayout (src/app/layout.js).
 * TROUBLESHOOT: If profile dropdown doesn't appear, check that session/profile
 *               props are passed from layout.js and Supabase auth listener is active.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  BookOpen,
  Info,
  User,
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronDown,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { isTrustedMentor } from "@/lib/helpers";

export default function Navbar({ user, profile }) {
  const pathname = usePathname();
  const router = useRouter();
  // [STEP 1 - FLOW: Holds whether the profile dropdown menu is open (true) or
  //  closed (false). Toggled by clicking the profile dropdown button.]
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // [STEP 2 - FLOW: Holds whether the GNC logo image failed to load. When true,
  //  renders a fallback text badge instead of the image.]
  const [logoError, setLogoError] = useState(false);
  // [STEP 3 - FLOW: React ref attached to the profile dropdown container, used
  //  by the click-outside listener to close the dropdown when clicking elsewhere.]
  const dropdownRef = useRef(null);

  // [STEP 4 - FLOW (useEffect): Closes the profile dropdown when the user clicks
  //  outside of it. Attaches a mousedown listener on document that checks if
  //  the click target is outside dropdownRef; if so, closes the dropdown.
  //  Cleans up the listener on unmount.]
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // [STEP 5 - FLOW (handler): Signs out the current Supabase user. Closes the
  //  dropdown, calls supabase.auth.signOut(), then redirects to /login and
  //  refreshes the router so the UI reflects the signed-out state.]
  async function handleLogout() {
    setDropdownOpen(false);
    // [DATA CALL: supabase.auth.signOut() — talks to Supabase Auth to sign out
    //  the current user, clearing the session. After sign-out, redirects to /login.]
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/subjects", label: "IT Subjects", icon: BookOpen },
    { href: "/about", label: "About", icon: Info },
  ];

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Student";

  return (
    <>
      {/* Desktop & Tablet Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            {!logoError ? (
              <img
                src="/gnc-logo.png"
                alt="Guagua National Colleges Seal"
                onError={() => setLogoError(true)}
                className="w-9 h-9 rounded-full object-cover border border-[#C59B27]"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#0F4C25] border border-[#C59B27] flex items-center justify-center text-white font-bold text-xs tracking-wider">
                GNC
              </div>
            )}
            <div className="leading-tight">
              <span className="block font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 tracking-tight">
                Knowledge Breach
              </span>
              <span className="block text-[11px] font-medium text-[#0F4C25] dark:text-[#C59B27]">
                GNC BSIT Peer Commons
              </span>
            </div>
          </Link>

          {/* Desktop Center Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#0F4C25] text-white"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Auth / Profile Dropdown */}
          <div className="flex items-center gap-3" ref={dropdownRef}>
            {user ? (
              <div className="relative">
                {/* [UI ELEMENT: PROFILE DROPDOWN TOGGLE BUTTON — clicking toggles
                 *  dropdownOpen state, showing/hiding the profile dropdown menu
                 *  with My Profile, Dashboard, Settings & Theme, and Log Out links.] */}
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-[#0F4C25] dark:hover:border-[#C59B27] transition-colors text-sm font-medium text-slate-800 dark:text-slate-100"
                >
                  <span className="w-6 h-6 rounded-full bg-[#0F4C25] text-white text-xs font-bold flex items-center justify-center">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline max-w-[140px] truncate">
                    {displayName}
                  </span>
                  {isTrustedMentor(profile) && (
                    <ShieldCheck className="w-4 h-4 text-[#C59B27]" title="Trusted Peer Mentor" />
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg py-1.5 z-50 animate-dropdown">
                    <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {displayName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>

                    <Link
                      href="/profile?tab=profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <User className="w-4 h-4 text-[#0F4C25] dark:text-[#C59B27]" />
                      My Profile
                    </Link>

                    <Link
                      href="/profile?tab=dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#0F4C25] dark:text-[#C59B27]" />
                      Dashboard
                    </Link>

                    <Link
                      href="/profile?tab=settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Settings className="w-4 h-4 text-[#0F4C25] dark:text-[#C59B27]" />
                      Settings &amp; Theme
                    </Link>

                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                    {/* [UI ELEMENT: LOG OUT BUTTON — clicking calls handleLogout,
                     *  which signs out the Supabase user and redirects to /login.] */}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#A31D1D] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* [UI: SIGN IN LINK BUTTON] */
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F4C25] hover:bg-[#0b3a1c] text-white text-sm font-semibold transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm flex items-center justify-around h-14 px-2">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg text-[11px] font-medium ${
                active
                  ? "text-[#0F4C25] dark:text-[#C59B27]"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
        <Link
          href={user ? "/profile?tab=profile" : "/login"}
          className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg text-[11px] font-medium ${
            pathname === "/profile" || pathname === "/login"
              ? "text-[#0F4C25] dark:text-[#C59B27]"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          <User className="w-4 h-4" />
          {user ? "Profile" : "Sign In"}
        </Link>
      </nav>
    </>
  );
}
