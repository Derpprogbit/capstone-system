/**
 * FILE: src/app/api/ratings/route.js
 * ROUTE: GET /api/ratings?userId=<uuid>  |  POST /api/ratings
 * PURPOSE: REST API for fetching peer reviews received by a user (GET) and
 *          submitting a 1-5 star rating + comment while recalculating
 *          trust_score and ratings_count on public.profiles (POST).
 * DATA FLOW:
 *   • GET: Reads userId query param. Fetches all ratings from public.ratings
 *     where ratee_id = userId, joined with the rater's profile, ordered newest
 *     first. Returns { ratings: [...] }.
 *   • POST: Reads JSON body { rater_id, ratee_id, post_id, stars, comment }.
 *     Validates fields and prevents self-rating. Inserts into public.ratings,
 *     fetches the ratee's profile, recalculates trust_score/ratings_count via
 *     calculateNewTrust, updates public.profiles, and returns the rating +
 *     updated profile.
 * USED BY / CALLED BY: PostCard (src/components/PostCard.js), Profile Page
 *                      (src/app/profile/page.js) via fetch GET and fetch POST.
 * TROUBLESHOOT: If trust_score does not update, check that 'profiles' has
 *               trust_score and ratings_count columns and RLS is disabled.
 */

import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { calculateNewTrust } from "@/lib/helpers";

export async function GET(request) {
  // [STEP 1 - FLOW (handler): GET /api/ratings. Reads userId query param,
  //  validates it, then fetches all ratings received by that user from
  //  public.ratings joined with the rater's profile, ordered newest first.]
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ratings: [] });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // [DATA CALL: supabase.from("ratings").select("*, rater:profiles!ratings_rater_id_fkey(id, full_name, role, trust_score)").eq("ratee_id", userId).order("created_at", { ascending: false })
    //  — talks to public.ratings joined with public.profiles (alias: rater,
    //  via the ratings_rater_id_fkey foreign key). Selects rater id, full_name,
    //  role, and trust_score. Filters by ratee_id. Expects an array of ratings.]
    const { data, error } = await supabase
      .from("ratings")
      .select("*, rater:profiles!ratings_rater_id_fkey(id, full_name, role, trust_score)")
      .eq("ratee_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ratings: data || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to fetch ratings" }, { status: 500 });
  }
}

export async function POST(request) {
  // [STEP 2 - FLOW (handler): POST /api/ratings. Reads JSON body,
  //  validates rater_id/ratee_id/stars, prevents self-rating, inserts into
  //  public.ratings, recalculates trust_score/ratings_count via
  //  calculateNewTrust, updates public.profiles, returns rating + updated
  //  profile with status 201.]
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { rater_id, ratee_id, post_id, stars, comment } = body;

    if (!rater_id || !ratee_id || !stars) {
      return NextResponse.json(
        { error: "rater_id, ratee_id, and stars are required." },
        { status: 400 }
      );
    }

    if (rater_id === ratee_id) {
      return NextResponse.json(
        { error: "You cannot rate yourself." },
        { status: 400 }
      );
    }

    // [DATA CALL: supabase.from("ratings").insert([{ rater_id, ratee_id,
    //  post_id, stars, comment }]).select().single()
    //  — talks to public.ratings. Inserts a new 1-5 star rating row. Expects
    //  the inserted rating row back.]
    const { data: insertedRating, error: insertError } = await supabase
      .from("ratings")
      .insert([
        {
          rater_id,
          ratee_id,
          post_id: post_id || null,
          stars: Number(stars),
          comment: (comment || "").trim(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // [DATA CALL: supabase.from("profiles").select("trust_score, ratings_count").eq("id", ratee_id).single()
    //  — talks to public.profiles. Fetches the ratee's current trust_score and
    //  ratings_count to recalculate the new average. Expects a single profile row.]
    const { data: rateeProfile, error: profileError } = await supabase
      .from("profiles")
      .select("trust_score, ratings_count")
      .eq("id", ratee_id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // [STEP 3 - FLOW: Recalculate trust_score and ratings_count using
    //  calculateNewTrust from src/lib/helpers.js, then persist to public.profiles.]
    const updatedTrust = calculateNewTrust(
      rateeProfile.trust_score,
      rateeProfile.ratings_count,
      stars
    );

    // [DATA CALL: supabase.from("profiles").update({ trust_score, ratings_count,
    //  updated_at }).eq("id", ratee_id).select().single()
    //  — talks to public.profiles. Updates the ratee's trust_score,
    //  ratings_count, and updated_at. Expects the updated profile row back.]
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({
        trust_score: updatedTrust.trust_score,
        ratings_count: updatedTrust.ratings_count,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ratee_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(
      { rating: insertedRating, profile: updatedProfile },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to submit rating" }, { status: 500 });
  }
}
