// FILE: src/app/profile/page.js
// PURPOSE: Tabbed hub for My Profile, Student/Admin Dashboard, and Settings.

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isAdmin, isTrustedMentor } from '@/lib/helpers';
import { ShieldCheck, Award } from 'lucide-react';

function ProfileContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get('tab') || 'profile';

  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState('');
  const [reviews, setReviews] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [fullName, setFullName] = useState('');
  const [section, setSection] = useState('');

  // Load user profile, received ratings, and admin data if admin
  async function loadProfileData() {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;
    if (!session) return router.push('/login');
    setToken(session.access_token);

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (!prof) return;
    setProfile(prof);
    setFullName(prof.full_name);
    setSection(prof.section || '');

    const revRes = await fetch(`/api/ratings?mentorId=${prof.id}`);
    const revData = await revRes.json();
    setReviews(revData.ratings || []);

    if (isAdmin(prof)) {
      const { data: students } = await supabase.from('profiles').select('*').eq('role', 'student');
      const { data: posts } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      setAllStudents(students || []);
      setAllPosts(posts || []);
    }
  }

  useEffect(() => { loadProfileData(); }, []);

  // Save updated name or section
  async function handleSaveSettings(e) {
    e.preventDefault();
    await supabase.from('profiles').update({ full_name: fullName, section }).eq('id', profile.id);
    alert('Profile updated!');
    loadProfileData();
  }

  // Admin action: pin/unpin post or verify student mentor
  async function adminAction(payload) {
    await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    loadProfileData();
  }

  if (!profile) return <p className="text-xs text-slate-500">Loading profile...</p>;

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-xs font-semibold">
        {['profile', 'dashboard', 'settings'].map((tab) => (
          <button key={tab} onClick={() => router.push(`/profile?tab=${tab}`)}
            className={`px-3.5 py-1.5 rounded-lg capitalize ${activeTab === tab ? 'bg-[#0F4C25] text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* TAB 1: MY PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{profile.full_name}</h1>
              <p className="text-xs font-mono text-slate-500">{profile.email} • {profile.section} • {profile.track}</p>
            </div>
            {isTrustedMentor(profile) && (
              <span className="px-3 py-1 rounded-lg bg-[#C59B27]/15 text-amber-800 dark:text-amber-300 text-xs font-mono font-bold inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#C59B27]" /> Trusted Mentor
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] text-slate-500">Trust Score</div>
              <div className="text-lg font-mono font-bold">★ {Number(profile.trust_score).toFixed(2)}</div>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] text-slate-500">Peer Reviews</div>
              <div className="text-lg font-mono font-bold">{profile.ratings_count}</div>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] text-slate-500">Account Role</div>
              <div className="text-lg font-mono font-bold uppercase">{profile.role}</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DASHBOARD (Student Reviews OR Admin Console) */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-bold flex items-center gap-2"><Award className="w-4 h-4 text-[#C59B27]" /> Peer Endorsements Received ({reviews.length})</h2>
            {reviews.length === 0 ? <p className="text-xs text-slate-500">No peer ratings yet.</p> : reviews.map((r) => (
              <div key={r.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs space-y-1">
                <div className="flex justify-between font-bold"><span>{r.rater?.full_name}</span><span className="font-mono text-[#C59B27]">{r.stars} ★</span></div>
                <p>"{r.comment}"</p>
              </div>
            ))}
          </div>

          {isAdmin(profile) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
                <h2 className="text-sm font-bold text-[#A31D1D]">Admin: Verify Student Mentors</h2>
                {allStudents.map((st) => (
                  <div key={st.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span>{st.full_name} (★ {Number(st.trust_score).toFixed(1)})</span>
                    <button onClick={() => adminAction({ action: 'verify_mentor', studentId: st.id, verified_mentor: !st.verified_mentor })} className="px-2.5 py-1 rounded border font-semibold">
                      {st.verified_mentor ? 'Verified ✓' : 'Grant Badge'}
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
                <h2 className="text-sm font-bold text-[#A31D1D]">Admin: Pin Threads</h2>
                {allPosts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800 gap-2">
                    <span className="truncate">{p.title}</span>
                    <button onClick={() => adminAction({ action: 'pin', postId: p.id, pinned: !p.pinned })} className="px-2.5 py-1 rounded border font-mono shrink-0">
                      {p.pinned ? 'Unpin' : 'Pin'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3.5 text-xs">
          <h2 className="text-sm font-bold">Account Settings</h2>
          <div>
            <label className="block font-semibold mb-1">Display Name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-950" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Year & Section</label>
            <input type="text" value={section} onChange={(e) => setSection(e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-950" />
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg bg-[#0F4C25] text-white font-semibold">Save Changes</button>
        </form>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return <Suspense fallback={<p className="text-xs">Loading...</p>}><ProfileContent /></Suspense>;
}