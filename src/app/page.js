// FILE: src/app/page.js
// PURPOSE: Home Feed with subject filters, search, new thread composer, and Trust/Team sidebars.

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { isTrustedMentor } from '@/lib/helpers';
import PostCard from '@/components/PostCard';
import ChatDrawer from '@/components/ChatDrawer';
import { Plus, Search, Award, Users, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [chatPeer, setChatPeer] = useState(null);

  // Form states for creating a new thread
  const [subject, setSubject] = useState('Networking 1');
  const [postType, setPostType] = useState('Help Request');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [teamMax, setTeamMax] = useState(4);

  // Fetches posts and top trusted mentors from Supabase
  async function loadData() {
    const res = await fetch('/api/posts');
    const data = await res.json();
    setPosts(data.posts || []);

    const { data: topUsers } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('trust_score', { ascending: false })
      .limit(5);
    setMentors(topUsers || []);
  }

  useEffect(() => {
    loadData();
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data?.session;
      if (session) {
        setToken(session.access_token);
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setCurrentUser(prof);
      }
    });
  }, []);

  // Publishes a new thread to /api/posts
  async function handleCreatePost(e) {
    e.preventDefault();
    if (!token) return alert('Please sign in to create a thread.');
    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        subject,
        post_type: postType,
        title,
        body,
        code_snippet: codeSnippet,
        team_max: postType === 'Team Recruitment' ? teamMax : 0,
      }),
    });
    setTitle('');
    setBody('');
    setCodeSnippet('');
    setShowModal(false);
    loadData();
  }

  const subjects = ['All', 'Networking 1', 'Web UI & Full-Stack Dev', 'Software Engineering', 'Game Development'];
  const filteredPosts = posts.filter((p) => {
    if (subjectFilter !== 'All' && p.subject !== subjectFilter) return false;
    if (search && !`${p.title} ${p.body}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openTeams = posts.filter((p) => p.team_max > 0 && (p.team_members || []).length < p.team_max);

  return (
    <div className="space-y-6">
      {/* Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">IT Community & Team Threads</h1>
          <p className="text-xs sm:text-sm text-slate-500">Collaborate on labs, recruit capstone teammates, and rate helpful peers.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            {/* Search input to filter threads by keyword */}
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search threads..." className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
          </div>
          {/* Button to open the New Thread popup */}
          <button onClick={() => setShowModal(true)} className="px-3.5 py-2 rounded-lg bg-[#0F4C25] hover:bg-[#0A361A] text-white text-xs font-semibold flex items-center gap-1.5 shrink-0">
            <Plus className="w-4 h-4" /> New Thread
          </button>
        </div>
      </div>

      {/* Subject Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {subjects.map((sub) => (
          <button key={sub} onClick={() => setSubjectFilter(sub)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border ${subjectFilter === sub ? 'bg-[#0F4C25] text-white border-[#0F4C25]' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'}`}>
            {sub}
          </button>
        ))}
      </div>

      {/* Main 2-Column Layout: Feed (Left) + Sidebars (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-3.5">
          {filteredPosts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center text-xs text-slate-500">
              No threads yet. Click <strong>New Thread</strong> to start the first discussion!
            </div>
          ) : (
            filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} currentUser={currentUser} token={token} onRefresh={loadData} onOpenChat={setChatPeer} />
            ))
          )}
        </div>

        {/* Right Sidebars */}
        <aside className="lg:col-span-4 space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-bold flex items-center gap-2"><Award className="w-4 h-4 text-[#C59B27]" /> Top Trusted Mentors</h2>
            {mentors.length === 0 && <p className="text-xs text-slate-500">No registered students yet.</p>}
            {mentors.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-xs py-1">
                <div>
                  <div className="font-semibold flex items-center gap-1">{m.full_name} {isTrustedMentor(m) && <ShieldCheck className="w-3.5 h-3.5 text-[#C59B27]" />}</div>
                  <div className="text-[11px] text-slate-500">{m.section}</div>
                </div>
                <span className="font-mono font-bold">★ {Number(m.trust_score).toFixed(1)}</span>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-bold flex items-center gap-2"><Users className="w-4 h-4 text-[#0F4C25]" /> Open Team Slots</h2>
            {openTeams.length === 0 && <p className="text-xs text-slate-500">No open capstone teams right now.</p>}
            {openTeams.map((t) => (
              <div key={t.id} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex justify-between font-mono text-[11px] text-[#0F4C25]"><span>{t.subject}</span><span>{(t.team_members || []).length}/{t.team_max}</span></div>
                <div className="font-semibold truncate mt-0.5">{t.title}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Create New Thread Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <form onSubmit={handleCreatePost} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-5 space-y-3.5">
            <h3 className="text-base font-bold">Create New Thread</h3>
            <div className="grid grid-cols-2 gap-3">
              {/* Subject track selector */}
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="px-3 py-2 text-xs rounded-lg border bg-white dark:bg-slate-950">
                {subjects.slice(1).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {/* Thread type selector */}
              <select value={postType} onChange={(e) => setPostType(e.target.value)} className="px-3 py-2 text-xs rounded-lg border bg-white dark:bg-slate-950">
                <option value="Help Request">Help Request</option>
                <option value="Team Recruitment">Team Recruitment</option>
                <option value="Lab Walkthrough">Lab Walkthrough</option>
              </select>
            </div>
            {postType === 'Team Recruitment' && (
              <div>
                <label className="text-xs font-semibold block mb-1">Total Team Size Needed</label>
                <input type="number" min="2" max="8" value={teamMax} onChange={(e) => setTeamMax(e.target.value)} className="w-24 px-3 py-1.5 text-xs font-mono rounded-lg border bg-white dark:bg-slate-950" />
              </div>
            )}
            {/* Input for thread title */}
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Thread title..." className="w-full px-3 py-2 text-xs rounded-lg border bg-white dark:bg-slate-950" />
            {/* Textarea for problem or team details */}
            <textarea rows="3" required value={body} onChange={(e) => setBody(e.target.value)} placeholder="Describe your question or team roles needed..." className="w-full px-3 py-2 text-xs rounded-lg border bg-white dark:bg-slate-950" />
            {/* Optional code or Cisco CLI snippet */}
            <textarea rows="2" value={codeSnippet} onChange={(e) => setCodeSnippet(e.target.value)} placeholder="Optional code or Cisco CLI snippet..." className="w-full px-3 py-2 text-xs font-mono rounded-lg border bg-slate-50 dark:bg-slate-950" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-3.5 py-2 text-xs text-slate-500">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-[#0F4C25] text-white text-xs font-semibold">Publish Thread</button>
            </div>
          </form>
        </div>
      )}

      <ChatDrawer peer={chatPeer} currentUser={currentUser} token={token} onClose={() => setChatPeer(null)} />
    </div>
  );
}