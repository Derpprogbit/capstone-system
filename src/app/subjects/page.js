// FILE: src/app/subjects/page.js
// PURPOSE: Displays the 4 BSIT tracks, interactive 7-Layer OSI Inspector, and module progress.

'use client';

import { useEffect, useState } from 'react';
import { SUBJECTS_DATA, OSI_LAYERS } from '@/lib/helpers';
import { Check, Circle, ExternalLink } from 'lucide-react';

export default function SubjectsPage() {
  const [selectedId, setSelectedId] = useState('net1');
  const [osiLayer, setOsiLayer] = useState(7);
  const [completed, setCompleted] = useState([]);

  // Load completed modules saved in browser localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('kb_completed_modules') || '[]');
    setCompleted(saved);
  }, []);

  // Toggle module completion checkbox
  function toggleModule(modId) {
    const next = completed.includes(modId) ? completed.filter((id) => id !== modId) : [...completed, modId];
    setCompleted(next);
    localStorage.setItem('kb_completed_modules', JSON.stringify(next));
  }

  const subject = SUBJECTS_DATA.find((s) => s.id === selectedId) || SUBJECTS_DATA[0];
  const activeOsi = OSI_LAYERS.find((l) => l.layer === osiLayer) || OSI_LAYERS[0];

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">BSIT Subject Repository & Labs</h1>
        <p className="text-xs sm:text-sm text-slate-500">Select a subject track to inspect modules, Cisco Packet Tracer labs, and video guides.</p>
      </div>

      {/* 4 Subject Track Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {SUBJECTS_DATA.map((sub) => (
          <button key={sub.id} onClick={() => setSelectedId(sub.id)}
            className={`text-left p-4 rounded-xl border transition-all ${selectedId === sub.id ? 'border-2 border-[#0F4C25] bg-white dark:bg-slate-900' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#0F4C25]/10 text-[#0F4C25] dark:text-emerald-400">{sub.code}</span>
            <h2 className="text-sm font-bold mt-2">{sub.name}</h2>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{sub.description}</p>
          </button>
        ))}
      </div>

      {/* Selected Subject Workspace */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-6">
        <div>
          <h2 className="text-lg font-bold">{subject.name}</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">{subject.description}</p>
        </div>

        {/* Interactive 7-Layer OSI Model Inspector (Shown for Networking 1) */}
        {subject.id === 'net1' && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase text-[#0F4C25] dark:text-emerald-400">Interactive 7-Layer OSI Model Inspector</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5 space-y-1.5">
                {OSI_LAYERS.map((item) => (
                  <button key={item.layer} onClick={() => setOsiLayer(item.layer)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs flex justify-between font-medium ${osiLayer === item.layer ? 'bg-[#0F4C25] text-white border-[#0F4C25]' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                    <span>L{item.layer}: {item.name}</span>
                    <span className="font-mono opacity-80">{item.pdu}</span>
                  </button>
                ))}
              </div>
              <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                <div className="font-mono text-[#0F4C25] font-bold">LAYER {activeOsi.layer} • PDU: {activeOsi.pdu}</div>
                <h4 className="text-base font-bold">{activeOsi.name} Layer</h4>
                <p><strong className="text-slate-500">Key Protocols:</strong> <span className="font-mono">{activeOsi.protocols}</span></p>
                <div className="p-3 rounded-lg bg-[#0F4C25]/10 text-slate-800 dark:text-slate-200">
                  <strong>Troubleshooting Tip:</strong> {activeOsi.tip}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modules & External Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Learning Modules</h3>
            {subject.modules.map((mod) => {
              const done = completed.includes(mod.id);
              return (
                <div key={mod.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-semibold">{mod.title}</div>
                    <div className="font-mono text-[11px] text-slate-400">{mod.duration}</div>
                  </div>
                  <button onClick={() => toggleModule(mod.id)} className={`px-2.5 py-1 rounded border font-semibold inline-flex items-center gap-1 ${done ? 'bg-[#0F4C25] text-white border-[#0F4C25]' : 'border-slate-300 dark:border-slate-700'}`}>
                    {done ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />} {done ? 'Done' : 'Mark'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Lab Tools & Video Guides</h3>
            {subject.resources.map((res, idx) => (
              <a key={idx} href={res.url} target="_blank" rel="noopener noreferrer" className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-[#0F4C25] flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono text-[11px] text-[#C59B27] font-bold">{res.type}</span>
                  <div className="font-semibold mt-0.5">{res.title}</div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}