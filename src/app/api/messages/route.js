// FILE: src/app/api/messages/route.js
// PURPOSE: Secure 1-on-1 direct messages between BSIT students.

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase';

// GET: Load conversation history between logged-in user and peerId
export async function GET(request) {
  const { user, db } = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const peerId = searchParams.get('peerId');
  if (!peerId) return NextResponse.json({ messages: [] });

  const { data, error } = await db
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${user.id})`)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ messages: data || [] });
}

// POST: Send a new direct message
export async function POST(request) {
  const { user, db } = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { receiver_id, body } = await request.json();
  if (!receiver_id || !body?.trim()) {
    return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
  }

  const { data, error } = await db
    .from('messages')
    .insert({ sender_id: user.id, receiver_id, body: body.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ message: data });
}