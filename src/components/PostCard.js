// FILE: src/components/PostCard.js
// PURPOSE: Displays a single forum thread with upvote, team join, replies, rating, and DM buttons.

'use client';

import { useState } from 'react';
import { isAdmin, isTrustedMentor } from '@/lib/helpers';
import { ChevronUp, MessageSquare, Users, Star, Send, Trash2, ShieldCheck, CheckCircle2, Pin } from 'lucide-react';

export default function PostCard({ post, currentUser, token, onRefresh, onOpenChat }) {
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [ratingTarget, setRatingTarget] = useState(null);
  const [stars, setStars] = useState(5);
  const [rateNote, setRateNote] = useState('');

  const author = post.author || {};
  const isUpvoted = currentUser && (post.upvotes || []).includes(currentUser.id);
  const isMember = currentUser && (post.team_members || []).includes(currentUser.id);
  const canDelete = currentUser && (currentUser.id === post.author_id || isAdmin(currentUser));

  // Helper to send authenticated requests to /api/posts
  async function patchPost(payload) {
    if (!token) return alert('Please sign in first.');
    await fetch('/api/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ postId: post.id, ...payload }),
    });
    onRefresh();
  }

  // Submits a new reply to this thread
  async function handleReply(e) {
    e.preventDefault();
    if (!replyText.trim()) return;
    await patchPost({ action: 'reply', commentBody: replyText });
    setReplyText('');
  }

  // Submits a 1-5 star trust rating for a helpful classmate
  async function handleRateSubmit(e) {
    e.preventDefault();
    await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ post_id: post.id, mentor_id: ratingTarget.id, stars, comment: rateNote }),
    });
    setRatingTarget(null);
    setRateNote('');
    onRefresh();
  }

  // Deletes this post (author or admin only)
  async function handleDelete() {
    if (!confirm('Delete this thread permanently?')) return;
    await fetch(`/api/admin?postId=${post.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    onRefresh();
  }

  return (
    <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
      <div className="flex gap-3.5">
        {/* Upvote Button */}
        <div className="flex flex-col items-center gap-1">
          <button onClick={() => patchPost({ action: 'upvote' })} className={`w-8 h-8 rounded-lg border flex items-center justify-center ${isUpvoted ? 'bg-[#0F4C25]/10 border-[#0F4C25] text-[#0F4C25]' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}>
            <ChevronUp className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold">{(post.upvotes || []).length}</span>
        </div>

        {/* Main Post Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
            {post.pinned && <span className="px-2 py-0.5 rounded bg-red-50 text-[#A31D1D] border border-red-200 inline-flex items-center gap-1"><Pin className="w-3 h-3" /> Pinned</span>}
            <span className="px-2 py-0.5 rounded bg-[#0F4C25]/10 text-[#0F4C25] dark:text-emerald-400 font-semibold">{post.subject}</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{post.post_type}</span>
            {post.resolved && <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Resolved</span>}
          </div>

          <h3 className="text-base font-bold leading-snug">{post.title}</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">{post.body}</p>

          {post.code_snippet && (
            <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto">{post.code_snippet}</pre>
          )}

          {/* Team Recruitment Join/Leave Box */}
          {post.team_max > 0 && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs">
                <Users className="w-4 h-4 text-[#0F4C25]" />
                <span>Team Slots: <strong className="font-mono">{(post.team_members || []).length} / {post.team_max}</strong></span>
              </div>
              {currentUser && (
                <button onClick={() => patchPost({ action: 'join_team' })} className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#0F4C25] text-white hover:bg-[#0A361A]">
                  {isMember ? 'Leave Team' : 'Join Team'}
                </button>
              )}
            </div>
          )}

          {/* Author Info & Action Buttons */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{author.full_name}</span>
              <span className="font-mono text-[11px] text-slate-500">{author.section}</span>
              {isTrustedMentor(author) && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#C59B27]/15 text-amber-800 dark:text-amber-300 font-mono text-[11px]">
                  <ShieldCheck className="w-3 h-3 text-[#C59B27]" /> ★ {Number(author.trust_score).toFixed(1)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {currentUser && currentUser.id !== post.author_id && (
                <>
                  {/* Button to open 1-on-1 Direct Message drawer */}
                  <button onClick={() => onOpenChat(author)} className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    <Send className="w-3 h-3" /> DM
                  </button>
                  {/* Button to rate this post's author */}
                  <button onClick={() => setRatingTarget(author)} className="px-2 py-1 rounded bg-[#C59B27]/15 text-amber-900 dark:text-amber-300 inline-flex items-center gap-1 font-medium">
                    <Star className="w-3 h-3 text-[#C59B27]" /> Rate
                  </button>
                </>
              )}
              <button onClick={() => setShowReplies(!showReplies)} className="px-2.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1 font-semibold text-[#0F4C25] dark:text-emerald-400">
                <MessageSquare className="w-3.5 h-3.5" /> {(post.comments || []).length} Replies
              </button>
              {canDelete && (
                <button onClick={handleDelete} title="Delete Thread" className="p-1 text-[#A31D1D] hover:bg-red-50 rounded">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Inline 1-5 Star Rating Form */}
      {ratingTarget && (
        <form onSubmit={handleRateSubmit} className="p-3 rounded-lg bg-[#C59B27]/10 border border-[#C59B27]/30 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold">Rate {ratingTarget.full_name} (1–5 Stars)</span>
            <select value={stars} onChange={(e) => setStars(Number(e.target.value))} className="px-2 py-1 rounded border bg-white dark:bg-slate-900 font-mono">
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
            </select>
          </div>
          {/* Input for peer review note */}
          <input type="text" required value={rateNote} onChange={(e) => setRateNote(e.target.value)} placeholder="Write a short endorsement note..." className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setRatingTarget(null)} className="px-2.5 py-1 text-slate-500">Cancel</button>
            <button type="submit" className="px-3 py-1 rounded bg-[#0F4C25] text-white font-semibold">Submit Rating</button>
          </div>
        </form>
      )}

      {/* Expandable Nested Replies Section */}
      {showReplies && (
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5 pl-4 sm:pl-10">
          {(post.comments || []).map((c) => (
            <div key={c.id} className={`p-3 rounded-lg border text-xs space-y-1 ${c.is_solution ? 'border-[#0F4C25] bg-[#0F4C25]/5' : 'border-slate-200 dark:border-slate-800'}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold">{c.author?.full_name || 'Student'}</span>
                <div className="flex items-center gap-2">
                  {currentUser && currentUser.id !== c.author_id && (
                    <button onClick={() => setRatingTarget(c.author)} className="text-[#C59B27] font-semibold hover:underline">Rate ★</button>
                  )}
                  {currentUser && currentUser.id === post.author_id && !c.is_solution && (
                    <button onClick={() => patchPost({ action: 'solve', commentId: c.id })} className="text-[#0F4C25] hover:underline">Mark Solution</button>
                  )}
                  {c.is_solution && <span className="text-[#0F4C25] font-mono font-bold">✓ Solution</span>}
                </div>
              </div>
              <p className="text-slate-700 dark:text-slate-300">{c.body}</p>
            </div>
          ))}

          {currentUser && (
            <form onSubmit={handleReply} className="flex gap-2">
              {/* Input for writing a thread reply */}
              <input type="text" required value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a helpful reply..." className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
              <button type="submit" className="px-3.5 py-1.5 rounded-lg bg-[#0F4C25] text-white text-xs font-semibold">Reply</button>
            </form>
          )}
        </div>
      )}
    </article>
  );
}