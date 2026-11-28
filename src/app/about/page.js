// FILE: src/app/about/page.js
// PURPOSE: Institutional overview and guide for Knowledge Bridge at GNC.

import { Network, ShieldCheck, Users } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 max-w-4xl space-y-6">
      <div className="space-y-1">
        <span className="text-xs font-mono font-bold text-[#0F4C25] dark:text-emerald-400">GUAGUA NATIONAL COLLEGES • BSIT CAPSTONE</span>
        <h1 className="text-2xl font-bold">About Knowledge Bridge</h1>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <strong>Knowledge Bridge</strong> is a collaborative academic learning and peer-mentorship portal designed for Bachelor of Science in Information Technology (BSIT) students at <strong>Guagua National Colleges</strong> in Guagua, Pampanga.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
          <Network className="w-5 h-5 text-[#0F4C25]" />
          <h2 className="text-sm font-bold">Subject-Aligned Labs</h2>
          <p className="text-xs text-slate-500">Interactive 7-Layer OSI reference, Cisco Packet Tracer guides, Web Dev, Software Eng, and Game Dev resources.</p>
        </div>
        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
          <ShieldCheck className="w-5 h-5 text-[#C59B27]" />
          <h2 className="text-sm font-bold">Peer Trust Reputation</h2>
          <p className="text-xs text-slate-500">Students rate helpful classmates 1–5★. Helpers maintaining ≥ 4.5★ across 5+ reviews earn Verified Trusted Mentor status.</p>
        </div>
        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
          <Users className="w-5 h-5 text-[#A31D1D]" />
          <h2 className="text-sm font-bold">Capstone Team Slots</h2>
          <p className="text-xs text-slate-500">Built-in team recruitment counters and 1-on-1 direct messaging help BSIT students form balanced thesis groups.</p>
        </div>
      </div>
    </div>
  );
}