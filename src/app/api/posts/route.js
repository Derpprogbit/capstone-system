// FILE: src/app/api/posts/route.js
// PURPOSE: Fetches threads, creates new posts, handles upvotes, team joins, and replies.

import { NextResponse } from 'next/server';
import { getAuthUser, supabase } from '@/lib/supabase';

// GET: Load all threads with author info and nested replies
export async function GET() {
  const { data, error } = await supabase
    .from('posts')
    .select('*, author:profiles!author_id(*), comments(*, author:profiles!author_id(*))')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ posts: data || [] });
}

// POST: Create a new thread (verifies user token on server)
export async function POST(request) {
  const { user, db } = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const teamMax = Number(body.team_max || 0);

  const { data, error } = await db
    .from('posts')
    .insert({
      author_id: user.id,
      subject: body.subject,
      post_type: body.post_type,
      title: body.title,
      body: body.body,
      code_snippet: body.code_snippet || '',
      looking_for: body.looking_for || [],
      team_max: teamMax,
      team_members: teamMax > 0 ? [user.id] : [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ post: data });
}

// PATCH: Toggle upvote, join/leave team, add reply, or mark resolved
export async function PATCH(request) {
  const { user, db } = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, postId, commentBody, commentId } = await request.json();

  if (action === 'reply') {
    const { error } = await db.from('comments').insert({
      post_id: postId,
      author_id: user.id,
      body: commentBody,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'solve') {
    await db.from('comments').update({ is_solution: true }).eq('id', commentId);
    await db.from('posts').update({ resolved: true }).eq('id', postId);
    return NextResponse.json({ ok: true });
  }

  const { data: post } = await db.from('posts').select('*').eq('id', postId).single();
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  if (action === 'upvote') {
    const list = post.upvotes || [];
    const next = list.includes(user.id) ? list.filter((id) => id !== user.id) : [...list, user.id];
    await db.from('posts').update({ upvotes: next }).eq('id', postId);
  }

  if (action === 'join_team') {
    const members = post.team_members || [];
    if (members.includes(user.id)) {
      if (post.author_id === user.id) return NextResponse.json({ error: 'Lead cannot leave' }, { status: 400 });
      await db.from('posts').update({ team_members: members.filter((id) => id !== user.id) }).eq('id', postId);
    } else if (members.length < post.team_max) {
      await db.from('posts').update({ team_members: [...members, user.id] }).eq('id', postId);
    }
  }

  return NextResponse.json({ ok: true });
}