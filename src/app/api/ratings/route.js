// FILE: src/app/api/ratings/route.js
// PURPOSE: Loads user reviews and submits 1-5 star peer ratings with trust score math.

import { NextResponse } from 'next/server';
import { getAuthUser, supabase } from '@/lib/supabase';
import { calculateNewTrust } from '@/lib/helpers';

// GET: Fetch reviews received by a specific user
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mentorId = searchParams.get('mentorId');
  if (!mentorId) return NextResponse.json({ ratings: [] });

  const { data, error } = await supabase
    .from('ratings')
    .select('*, rater:profiles!rater_id(full_name, section)')
    .eq('mentor_id', mentorId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ratings: data || [] });
}

// POST: Submit a 1-5 star rating and update the mentor's trust_score
export async function POST(request) {
  const { user, db } = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { post_id, mentor_id, stars, comment } = await request.json();
  if (user.id === mentor_id) {
    return NextResponse.json({ error: 'You cannot rate yourself.' }, { status: 400 });
  }

  const { error: insertErr } = await db.from('ratings').insert({
    post_id: post_id || null,
    rater_id: user.id,
    mentor_id,
    stars: Number(stars),
    comment,
  });
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 400 });

  // Recalculate and update the mentor's profile score
  const { data: mentor } = await db.from('profiles').select('trust_score, ratings_count').eq('id', mentor_id).single();
  if (mentor) {
    const updated = calculateNewTrust(mentor.trust_score, mentor.ratings_count, stars);
    await db.from('profiles').update(updated).eq('id', mentor_id);
  }

  return NextResponse.json({ ok: true });
}