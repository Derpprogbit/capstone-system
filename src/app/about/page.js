/**
 * FILE: src/app/about/page.js
 * ROUTE: /about
 * PURPOSE: Detailed overview of Knowledge Breach's mission, peer trust system,
 *          and team recruitment workflow for Guagua National Colleges BSIT students.
 *          Purely informational; no state, effects, or data fetching.
 * DATA FLOW: None — static content only. Reads no database tables and calls no
 *            API endpoints. All text and icons are hardcoded.
 * USED BY / CALLED BY: Navbar About link (desktop and mobile navigation).
 * TROUBLESHOOT: Static informational page; no database calls required. If links
 *               don't navigate, verify Next.js Link href values point to "/" and
 *               "/subjects".
 */

import Link from "next/link";
import { ShieldCheck, Users, BookOpen, MessageSquare } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#0F4C25]/10 text-[#0F4C25] dark:bg-[#0F4C25]/30 dark:text-emerald-300 mb-3">
          Guagua National Colleges • BSIT
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
          About Knowledge Breach
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          Knowledge Breach is the dedicated BSIT Peer Commons for Guagua National Colleges.
          It brings together structured IT curriculum references, capstone &amp; lab team
          recruitment, and a transparent peer trust system so students can collaborate
          effectively across Networking, Web Development, Software Engineering, and Game
          Development.
        </p>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="w-10 h-10 rounded-lg bg-[#0F4C25]/10 text-[#0F4C25] dark:text-[#C59B27] flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-900 dark:text-slate-100">
            Peer Trust &amp; Endorsements
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
            Students can rate and endorse peers (1–5 stars + feedback) after collaborating.
            Peers who maintain a 4.0★+ average with at least 2 reviews earn the{" "}
            <strong className="text-[#C59B27]">Trusted Mentor</strong> badge.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="w-10 h-10 rounded-lg bg-[#0F4C25]/10 text-[#0F4C25] dark:text-[#C59B27] flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-900 dark:text-slate-100">
            Team Recruitment Workflow
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
            Post open capstone or lab roles using comma-separated tags (e.g.,{" "}
            <code className="text-xs px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
              Frontend, Cisco Config, Docs
            </code>
            ) and connect directly via 1-on-1 Direct Messages.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="w-10 h-10 rounded-lg bg-[#0F4C25]/10 text-[#0F4C25] dark:text-[#C59B27] flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-900 dark:text-slate-100">
            Structured IT Subjects
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
            Drill down into Networking 1 &amp; Cisco Labs (OSI 7-Layer tables, IPv4/VLSM
            cheat sheets, YouTube lectures, and <code className="text-xs">.pkt</code>{" "}
            files), Web UI, Software Engineering, and Game Development.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="w-10 h-10 rounded-lg bg-[#0F4C25]/10 text-[#0F4C25] dark:text-[#C59B27] flex items-center justify-center mb-3">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-900 dark:text-slate-100">
            Real-Time 1-on-1 DMs
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
            Click <strong>Request to Join / DM</strong> on any post or sidebar slot to
            open the slide-over chat drawer and coordinate with your teammates.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        {/* [UI: EXPLORE FEED LINK BUTTON] */}
        <Link
          href="/"
          className="px-4 py-2.5 rounded-lg bg-[#0F4C25] hover:bg-[#0b3a1c] text-white text-sm font-semibold transition-colors"
        >
          Explore Peer Feed
        </Link>

        {/* [UI: BROWSE SUBJECTS LINK BUTTON] */}
        <Link
          href="/subjects"
          className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#0F4C25] text-sm font-semibold text-slate-800 dark:text-slate-100 transition-colors"
        >
          Browse IT Subjects
        </Link>
      </div>
    </div>
  );
}
