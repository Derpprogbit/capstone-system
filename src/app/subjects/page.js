/**
 * FILE: src/app/subjects/page.js
 * ROUTE: /subjects
 * PURPOSE: Interactive IT Subjects directory with expandable accordion modules
 *          containing structured lesson tables, YouTube lecture links, and
 *          Cisco Packet Tracer (.pkt) download buttons.
 * DATA FLOW: Reads static SUBJECTS_DATA from src/lib/helpers.js (no database
 *            calls, no API endpoints). User selection drives which subject's
 *            modules and lessons are displayed.
 * USED BY / CALLED BY: Navbar IT Subjects link (/subjects).
 * TROUBLESHOOT: Subject and module content is sourced from SUBJECTS_DATA in
 *               src/lib/helpers.js. If a subject card, module, YouTube link, or
 *               .pkt download is missing, check SUBJECTS_DATA.
 */

"use client";

import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  PlayCircle,
  Download,
} from "lucide-react";
import { SUBJECTS_DATA } from "@/lib/helpers";

export default function SubjectsPage() {
  // [STEP 1 - FLOW: Holds the ID of the currently selected subject. Initialized
  //  to the first subject's id. Changed when the user clicks a subject card.]
  const [selectedSubjectId, setSelectedSubjectId] = useState(SUBJECTS_DATA[0].id);
  // [STEP 2 - FLOW: Holds the ID of the currently open accordion module (or null
  //  if none is open). Initialized to the first module of the first subject.
  //  Changed when the user toggles a module accordion.]
  const [openModuleId, setOpenModuleId] = useState(SUBJECTS_DATA[0].modules[0]?.id || null);

  const activeSubject =
    SUBJECTS_DATA.find((s) => s.id === selectedSubjectId) || SUBJECTS_DATA[0];

  // [STEP 3 - FLOW (handler): Called when the user clicks a subject card.
  //  Updates selectedSubjectId to the clicked subject's id and resets
  //  openModuleId to that subject's first module (or null).]
  function handleSelectSubject(subj) {
    setSelectedSubjectId(subj.id);
    setOpenModuleId(subj.modules[0]?.id || null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-[#0F4C25] dark:text-[#C59B27]" />
          BSIT Subjects &amp; Lab Modules
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Select a subject card below to inspect structured study tables, video lectures, and Cisco Packet Tracer labs.
        </p>
      </div>

      {/* Interactive Subject Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SUBJECTS_DATA.map((subj) => {
          const isSelected = subj.id === activeSubject.id;
          return (
            /* [UI ELEMENT: SUBJECT CARD BUTTON - clicking selects the subject, updates selectedSubjectId via handleSelectSubject, and opens that subject's first module accordion.] */
            <button
              key={subj.id}
              type="button"
              onClick={() => handleSelectSubject(subj)}
              className={`text-left rounded-xl border p-4 transition-all ${
                isSelected
                  ? "border-[#0F4C25] bg-[#0F4C25]/5 dark:bg-[#0F4C25]/20 dark:border-[#C59B27] shadow-xs"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#0F4C25]/50"
              }`}
            >
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-[#0F4C25] text-white">
                {subj.code}
              </span>
              <h2 className="mt-2 font-bold text-sm text-slate-900 dark:text-slate-100">
                {subj.name}
              </h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                {subj.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Expandable Accordion Modules */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {activeSubject.name} — Modules
        </h2>

        {activeSubject.modules.map((mod) => {
          const isOpen = openModuleId === mod.id;
          return (
            <div
              key={mod.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
            >
              {/* [UI ELEMENT: MODULE ACCORDION TOGGLE BUTTON — clicking expands
             *  or collapses the current module's content (lesson table, YouTube
             *  link, .pkt download). Updates openModuleId via setOpenModuleId.] */}
              <button
                type="button"
                onClick={() => setOpenModuleId(isOpen ? null : mod.id)}
                className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {mod.summary}
                  </p>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-slate-500 shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  {/* Action Links */}
                  <div className="flex flex-wrap gap-2">
                    {mod.youtubeUrl && (
                      /* [UI: YOUTUBE LECTURE LINK BUTTON] */
                      <a
                        href={mod.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#A31D1D] hover:bg-[#861717] text-white text-xs font-semibold transition-colors"
                      >
                        <PlayCircle className="w-4 h-4" />
                        Watch YouTube Lecture
                      </a>
                    )}

                    {mod.pktDownloadUrl && (
                      /* [UI: PACKET TRACER DOWNLOAD BUTTON] */
                      <a
                        href={mod.pktDownloadUrl}
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F4C25] hover:bg-[#0b3a1c] text-white text-xs font-semibold transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download .pkt Lab
                      </a>
                    )}
                  </div>

                  {/* Structured Lesson Table */}
                  {mod.tableHeaders && mod.tableRows && (
                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                            {mod.tableHeaders.map((header) => (
                              <th key={header} className="px-3.5 py-2.5 font-semibold">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {mod.tableRows.map((row, rIdx) => (
                            <tr
                              key={rIdx}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                            >
                              {row.map((cell, cIdx) => (
                                <td
                                  key={cIdx}
                                  className="px-3.5 py-2.5 text-slate-700 dark:text-slate-300"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
