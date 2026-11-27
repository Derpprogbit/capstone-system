/**
 * FILE: src/app/api/messages/route.js
 * ROUTE: GET /api/messages?user1=<uuid>&user2=<uuid>  |  POST /api/messages
 * PURPOSE: REST API for 1-on-1 Direct Messaging: fetch conversation history
 *          between two users (GET) and send a new message (POST).
 * DATA FLOW:
 *   • GET: Reads user1 and user2 query params, fetches bidirectional messages
 *     from public.messages where (sender=user1 AND receiver=user2) OR
 *     (sender=user2 AND receiver=user1), ordered by created_at ascending.
 *   • POST: Reads JSON body { sender_id, receiver_id, content }, inserts a new
 *     row into public.messages, returns the created message.
 * USED BY / CALLED BY: ChatDrawer (src/components/ChatDrawer.js) via fetch GET
 *                      and fetch POST.
 * TROUBLESHOOT: Ensure both user1 and user2 query params are passed on GET.
 *               Verify schema.sql has been executed and RLS is disabled on
 *               public.messages.
 */

import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(request) {
  // [STEP 1 - FLOW (handler): GET /api/messages. Reads user1 and user2 from
  //  query params, validates both are present, then fetches bidirectional
  //  messages between the two users from public.messages ordered by created_at.]
  if (!isSupabaseConfigured) {
    return NextResponse.json({ messages: [] });
  }

  try {
    const { searchParams } = new URL(request.url);
    const user1 = searchParams.get("user1");
    const user2 = searchParams.get("user2");

    if (!user1 || !user2) {
      return NextResponse.json(
        { error: "user1 and user2 query parameters are required." },
        { status: 400 }
      );
    }

    // [DATA CALL: supabase.from("messages").select("*").or(...).order("created_at", { ascending: true })
    //  — talks to public.messages. Uses Supabase .or() filter to find messages
    //  where (sender_id=user1 AND receiver_id=user2) OR (sender_id=user2 AND
    //  receiver_id=user1). Expects an array of message rows.]
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages: data || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request) {
  // [STEP 2 - FLOW (handler): POST /api/messages. Reads JSON body
  //  { sender_id, receiver_id, content }, validates all three fields, then
  //  inserts a new direct message into public.messages and returns it with
  //  status 201.]
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { sender_id, receiver_id, content } = body;

    if (!sender_id || !receiver_id || !content?.trim()) {
      return NextResponse.json(
        { error: "sender_id, receiver_id, and content are required." },
        { status: 400 }
      );
    }

    // [DATA CALL: supabase.from("messages").insert([{ sender_id, receiver_id,
    //  content }]).select().single()
    //  — talks to public.messages. Inserts a new row with sender_id, receiver_id,
    //  and trimmed content. Expects the inserted message row back.]
    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          sender_id,
          receiver_id,
          content: content.trim(),
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to send message" }, { status: 500 });
  }
}
