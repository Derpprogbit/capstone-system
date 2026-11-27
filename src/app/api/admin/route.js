/**
 * FILE: src/app/api/admin/route.js
 * ROUTE: DELETE /api/admin?postId=<uuid>&requesterId=<uuid>
 * PURPOSE: Admin & author moderation endpoint to DELETE a post from public.posts.
 *          Only the post's author or a user with role === 'admin' can delete.
 * DATA FLOW:
 *   • Client sends DELETE with query params postId and requesterId.
 *   • Route fetches the requester's profile (role) and the target post (author_id)
 *     from Supabase to verify authorization.
 *   • If authorized, deletes the post from public.posts and returns { deleted: true, postId }.
 * USED BY / CALLED BY: PostCard (src/components/PostCard.js) via fetch DELETE.
 * TROUBLESHOOT: Verifies that requesterId is either the post's author_id or
 *               has role === 'admin' in public.profiles. Ensure schema.sql has
 *               been executed and RLS is disabled on public.posts and
 *               public.profiles.
 */

import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { isAdmin } from "@/lib/helpers";

export async function DELETE(request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    const requesterId = searchParams.get("requesterId");

    if (!postId || !requesterId) {
      return NextResponse.json(
        { error: "postId and requesterId are required." },
        { status: 400 }
      );
    }

    // [STEP 1 - FLOW (handler): DELETE /api/admin handler. Reads postId and
    //  requesterId from query params, then validates authorization before
    //  deleting.]
    // [DATA CALL: supabase.from("profiles").select("id, role").eq("id", requesterId).single()
    //  — talks to public.profiles. Expects a single row with the requester's
    //  id and role to determine admin status.]
    // [DATA CALL: supabase.from("posts").select("id, author_id").eq("id", postId).single()
    //  — talks to public.posts. Expects a single row with the post's id and
    //  author_id to verify ownership.]
    const [{ data: requester }, { data: post }] = await Promise.all([
      supabase.from("profiles").select("id, role").eq("id", requesterId).single(),
      supabase.from("posts").select("id, author_id").eq("id", postId).single(),
    ]);

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const authorized = isAdmin(requester) || post.author_id === requesterId;
    if (!authorized) {
      return NextResponse.json(
        { error: "Unauthorized: only Admins or the post author can delete this post." },
        { status: 403 }
      );
    }

    // [STEP 2 - FLOW: Delete post from public.posts. Only reached if the
    //  requester is the author or an admin. Returns { deleted: true, postId } on success.]
    // [DATA CALL: supabase.from("posts").delete().eq("id", postId)
    //  — talks to public.posts. Deletes the row matching postId. Expects
    //  { error } or success with no error.]
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ deleted: true, postId });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to delete post" }, { status: 500 });
  }
}
