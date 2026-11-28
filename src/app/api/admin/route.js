// FILE: src/app/api/admin/route.js
// PURPOSE: Handles post deletion (author or admin) and admin pin/verification actions.

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase';

// DELETE: Remove a post (allowed for post author or admin via RLS)
export async function DELETE(request) {
  const { user, db } = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const postId = searchParams.get('postId');
  if (!postId) return NextResponse.json({ error: 'Missing postId' }, { status: 400 });

  const { error } = await db.from('posts').delete().eq('id', postId);
  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  return NextResponse.json({ ok: true });
}

// PATCH: Admin-only actions (pin post or verify student mentor)
export async function PATCH(request) {
  const { user, db } = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: me } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (me?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const { action, postId, pinned, studentId, verified_mentor } = await request.json();

  if (action === 'pin') {
    await db.from('posts').update({ pinned }).eq('id', postId);
  }
  if (action === 'verify_mentor') {
    await db.from('profiles').update({ verified_mentor }).eq('id', studentId);
  }

  return NextResponse.json({ ok: true });
}