/**
 * FILE: src/components/PostCard.js
 * ROUTE: Client component (used by / page)
 * PURPOSE: Renders an individual peer post with subject badge, post type, author
 *          name, Trusted Peer Mentor badge, Looking For role tags, Request to Join / DM
 *          button, expandable 1-5 star Rate & Endorse form, and Delete button.
 * DATA FLOW:
 *   • Displays post data passed as props (title, content, subject, post_type,
 *     looking_for, author profile, created_at).
 *   • Clicking "Request to Join / DM" calls onOpenChat with the post author.
 *   • Clicking "Rate & Endorse" opens a form; submitting calls POST /api/ratings
 *     with { rater_id, ratee_id, post_id, stars, comment }.
 *   • Clicking "Delete" (author or admin only) calls DELETE /api/admin?postId=&requesterId=.
 * USED BY / CALLED BY: Home Feed (src/app/page.js) renders PostCard for each post.
 * TROUBLESHOOT: If rating submission fails, check /api/ratings and ensure
 *               currentUser is logged in and not rating their own post. If delete
 *               fails, verify the user is the post author or has admin role.
 */

"use client";

import { useState } from "react";
import {
  MessageSquare,
  Star,
  Trash2,
  ShieldCheck,
  Users,
  Clock,
} from "lucide-react";
import { isAdmin, isTrustedMentor } from "@/lib/helpers";

export default function PostCard({
  post,
  currentUser,
  currentProfile,
  onOpenChat,
  onPostDeleted,
  onRatingSubmitted,
}) {
  // [STEP 1 - FLOW: Controls whether the Rate & Endorse form is visible. Toggled
  //  by the Rate & Endorse button and reset after submission.]
  const [showRateForm, setShowRateForm] = useState(false);
  // [STEP 2 - FLOW: Holds the selected star value (1-5) for the rating form.
  //  Updated when the user clicks a star button.]
  const [stars, setStars] = useState(5);
  // [STEP 3 - FLOW: Holds the endorsement comment text for the rating form.
  //  Updated on every keystroke via onChange.]
  const [comment, setComment] = useState("");
  // [STEP 4 - FLOW: Boolean flag set to true while a rating submission is in
  //  flight, used to disable the submit button.]
  const [submittingRating, setSubmittingRating] = useState(false);
  // [STEP 5 - FLOW: Boolean flag set to true while a delete request is in
  //  flight, used to disable the delete button and show "Deleting..." text.]
  const [deleting, setDeleting] = useState(false);
  // [STEP 6 - FLOW: Holds feedback messages (success or error) to display
  //  below the rating form. Set by handleRateSubmit.]
  const [feedback, setFeedback] = useState("");

  const author = post.author || {};
  const canDelete =
    currentUser &&
    (currentUser.id === post.author_id || isAdmin(currentProfile));
  const isOwnPost = currentUser?.id === post.author_id;

  // [STEP 7 - FLOW (handler): Submits a 1-5 star rating and comment to POST
  //  /api/ratings. Validates currentUser, sets submitting state, posts
  //  { rater_id, ratee_id, post_id, stars, comment }, and on success shows
  //  feedback, clears the form, and calls onRatingSubmitted.]
  async function handleRateSubmit(e) {
    e.preventDefault();
    if (!currentUser) {
      setFeedback("Please sign in to rate peers.");
      return;
    }
    setSubmittingRating(true);
    setFeedback("");

    try {
      // [DATA CALL: fetch POST /api/ratings — talks to the /api/ratings POST
      //  endpoint, which inserts into public.ratings and updates public.profiles
      //  trust_score/ratings_count. Sends JSON body
      //  { rater_id, ratee_id, post_id, stars, comment }. Expects
      //  { rating, profile } on success.]
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rater_id: currentUser.id,
          ratee_id: post.author_id,
          post_id: post.id,
          stars,
          comment,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.error || "Failed to submit rating.");
      } else {
        setFeedback("Endorsement submitted!");
        setComment("");
        setShowRateForm(false);
        if (onRatingSubmitted) onRatingSubmitted(data.profile);
      }
    } catch {
      setFeedback("Network error while submitting rating.");
    } finally {
      setSubmittingRating(false);
    }
  }

  // [STEP 8 - FLOW (handler): Deletes a post via DELETE /api/admin. Only
  //  available to the post author or an admin. Sets deleting state, calls
  //  DELETE /api/admin?postId=&requesterId=, and on success calls onPostDeleted.]
  async function handleDelete() {
    if (!currentUser) return;
    setDeleting(true);
    try {
      // [DATA CALL: fetch DELETE /api/admin?postId=<post.id>&requesterId=<currentUser.id>
      //  — talks to the /api/admin DELETE endpoint, which deletes from public.posts
      //  after verifying the requester is the author or an admin. Expects
      //  { deleted: true, postId } on success.]
      const res = await fetch(
        `/api/admin?postId=${encodeURIComponent(post.id)}&requesterId=${encodeURIComponent(
          currentUser.id
        )}`,
        { method: "DELETE" }
      );
      if (res.ok && onPostDeleted) {
        onPostDeleted(post.id);
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-colors">
      {/* Header Metadata */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#0F4C25] text-white font-bold text-sm flex items-center justify-center shrink-0">
            {(author.full_name || "S").charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                {author.full_name || "BSIT Student"}
              </span>
              {isTrustedMentor(author) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#C59B27]/15 text-[#8a6a10] dark:text-[#C59B27] border border-[#C59B27]/40">
                  <ShieldCheck className="w-3 h-3" />
                  Trusted Mentor
                </span>
              )}
              <span className="text-xs text-slate-500 dark:text-slate-400">
                • ★ {Number(author.trust_score || 0).toFixed(1)} ({author.ratings_count || 0})
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(post.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#0F4C25]/10 text-[#0F4C25] dark:bg-[#0F4C25]/30 dark:text-emerald-300 border border-[#0F4C25]/20">
            {post.subject}
          </span>
          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {post.post_type}
          </span>
        </div>
      </div>

      {/* Post Body */}
      <div className="mt-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {post.title}
        </h3>
        <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
          {post.content}
        </p>
      </div>

      {/* Looking For Role Tags */}
      {Array.isArray(post.looking_for) && post.looking_for.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 mr-1">
            <Users className="w-3.5 h-3.5 text-[#0F4C25] dark:text-[#C59B27]" />
            Looking for:
          </span>
          {post.looking_for.map((role, idx) => (
            <span
              key={`${role}-${idx}`}
              className="px-2 py-0.5 rounded-md text-xs font-medium bg-[#C59B27]/15 text-[#7c5f0c] dark:text-[#e6be4c] border border-[#C59B27]/30"
            >
              {role}
            </span>
          ))}
        </div>
      )}

      {/* Action Bar */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {!isOwnPost && (
            {/* [UI ELEMENT: REQUEST TO JOIN / DM BUTTON — visible only on
             *  other users' posts. Clicking calls onOpenChat(author), which
             *  opens the slide-over chat drawer with the post author as the
             *  recipient.] */}
            <button
              type="button"
              onClick={() => onOpenChat && onOpenChat(author)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F4C25] hover:bg-[#0b3a1c] text-white text-xs font-semibold transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Request to Join / DM
            </button>
          )}

          {!isOwnPost && (
            {/* [UI ELEMENT: RATE & ENDORSE TOGGLE BUTTON — visible only on
             *  other users' posts. Clicking toggles showRateForm state to open
             *  or close the expandable 1-5 star rating and comment form.] */}
            <button
              type="button"
              onClick={() => setShowRateForm((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#C59B27] text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
            >
              <Star className="w-3.5 h-3.5 text-[#C59B27]" />
              Rate &amp; Endorse
            </button>
          )}
        </div>

        {canDelete && (
          {/* [UI ELEMENT: DELETE POST BUTTON — visible only to the post author
           *  or an admin. Clicking calls handleDelete, which sends DELETE to
           *  /api/admin to remove the post from public.posts.] */}
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#A31D1D] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deleting ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>

      {/* Expandable 1-5 Star Rate & Endorse Form */}
      {showRateForm && (
        <form
          onSubmit={handleRateSubmit}
          className="mt-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Endorse {author.full_name || "Peer"}
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((num) => (
                {/* [UI ELEMENT: STAR RATING BUTTON — clicking sets the stars
                 *  state to the clicked number (1-5), visually highlighting the
                 *  selected rating in the Rate & Endorse form.] */}
                <button
                  key={num}
                  type="button"
                  onClick={() => setStars(num)}
                  className="p-0.5"
                  aria-label={`Rate ${num} stars`}
                >
                  <Star
                    className={`w-4 h-4 ${
                      num <= stars
                        ? "fill-[#C59B27] text-[#C59B27]"
                        : "text-slate-300 dark:text-slate-600"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* [UI ELEMENT: ENDORSEMENT COMMENT INPUT — typing updates the comment
           *  state via setComment. Optional free-text feedback accompanying the
           *  star rating.] */}
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share how this peer helped your team or study..."
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0F4C25]"
          />

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {feedback}
            </span>
            {/* [UI ELEMENT: SUBMIT ENDORSEMENT BUTTON — clicking submits the
             *  rating form via handleRateSubmit, which POSTs to /api/ratings.
             *  Disabled while a submission is in flight.] */}
            <button
              type="submit"
              disabled={submittingRating}
              className="px-3 py-1.5 rounded-lg bg-[#0F4C25] hover:bg-[#0b3a1c] text-white text-xs font-semibold disabled:opacity-50"
            >
              {submittingRating ? "Saving..." : "Submit Endorsement"}
            </button>
          </div>
        </form>
      )}
    </article>
  );
}
