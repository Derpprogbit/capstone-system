/**
 * FILE: src/app/api/posts/route.js
 * ROUTE: GET /api/posts?subject=<name>&authorId=<uuid>  |  POST /api/posts
 * PURPOSE: REST API for fetching peer posts joined with author profiles (GET)
 *          and creating new threads or team recruitment posts (POST).
 * DATA FLOW:
 *   • GET: Reads optional subject and authorId query params. Queries public.posts
 *     joined with public.profiles (as author), ordered newest first. Filters by
 *     subject and/or authorId when provided. Returns { posts: [...] }.
 *   • POST: Reads JSON body { author_id, subject, post_type, title, content,
 *     looking_for }. Validates required fields, normalizes looking_for into an
 *     array, inserts into public.posts, returns the created post with joined
 *     author profile.
 * USED BY / CALLED BY: Home Feed (src/app/page.js), Profile Dashboard
 *                      (src/app/profile/page.js) via fetch GET and fetch POST.
 * TROUBLESHOOT: Verify Supabase tables 'posts' and 'profiles' exist and RLS is
 *               disabled for initial capstone testing.
 */

import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(request) {
  // [STEP 1 - FLOW (handler): GET /api/posts. Reads optional subject and
  //  authorId query params, builds a Supabase query on public.posts joined with
  //  public.profiles (as author), applies filters, orders newest first, and
  //  returns { posts: [...] }.]
  if (!isSupabaseConfigured) {
    return NextResponse.json({ posts: [], warning: "Supabase not configured" });
  }

  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get("subject");
    const authorId = searchParams.get("authorId");

    // [DATA CALL: supabase.from("posts").select("*, author:profiles(*)").order("created_at", { ascending: false })
    //  — talks to public.posts joined with public.profiles (alias: author).
    //  Expects an array of posts, each with nested author profile data.]
    let query = supabase
      .from("posts")
      .select("*, author:profiles(*)")
      .order("created_at", { ascending: false });

    if (subject && subject !== "All") {
      query = query.eq("subject", subject);
    }
    if (authorId) {
      query = query.eq("author_id", authorId);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ posts: data || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request) {
  // [STEP 2 - FLOW (handler): POST /api/posts. Reads JSON body, validates
  //  required fields (author_id, subject, title, content), normalizes
  //  looking_for into a trimmed array, inserts into public.posts with joined
  //  author profile, returns { post: data } with status 201.]
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { author_id, subject, post_type, title, content, looking_for } = body;

    if (!author_id || !subject || !title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "author_id, subject, title, and content are required." },
        { status: 400 }
      );
    }

    const cleanLookingFor = Array.isArray(looking_for)
      ? looking_for.map((r) => r.trim()).filter(Boolean)
      : [];

    // [DATA CALL: supabase.from("posts").insert([{ author_id, subject,
    //  post_type, title, content, looking_for }]).select("*, author:profiles(*)").single()
    //  — talks to public.posts. Inserts a new post row and returns it with the
    //  joined author profile. Expects a single post object.]
    const { data, error } = await supabase
      .from("posts")
      .insert([
        {
          author_id,
          subject,
          post_type: post_type || "Team Recruitment",
          title: title.trim(),
          content: content.trim(),
          looking_for: cleanLookingFor,
        },
      ])
      .select("*, author:profiles(*)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ post: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to create post" }, { status: 500 });
  }
}
