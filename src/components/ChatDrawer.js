/**
 * FILE: src/components/ChatDrawer.js
 * ROUTE: Client component (used by / page)
 * PURPOSE: Slide-over 1-on-1 Direct Message panel that polls /api/messages
 *          every 3 seconds when open and lets peers send real-time DMs.
 * DATA FLOW:
 *   • When opened, polls GET /api/messages?user1=&user2= every 3 seconds to
 *     refresh conversation history between currentUser and recipient.
 *   • User types in the message input and clicks Send → POST /api/messages with
 *     { sender_id, receiver_id, content }; the new message is appended locally.
 *   • Auto-scrolls to the bottom whenever the messages array changes.
 * USED BY / CALLED BY: Home Feed (src/app/page.js) renders ChatDrawer when a
 *                      user clicks a mentor DM button or team slot DM button.
 * TROUBLESHOOT: If messages don't load, verify currentUser.id and recipient.id
 *               are valid UUIDs and /api/messages returns 200 OK. If sending
 *               fails, check that the request body includes sender_id,
 *               receiver_id, and content.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, MessageSquare } from "lucide-react";

export default function ChatDrawer({ isOpen, onClose, currentUser, recipient }) {
  // [STEP 1 - FLOW: Holds the array of message objects for the current
  //  conversation. Populated by polling /api/messages and updated when a new
  //  message is sent.]
  const [messages, setMessages] = useState([]);
  // [STEP 2 - FLOW: Holds the draft text the user is typing in the DM input.
  //  Updated on every keystroke via onChange.]
  const [text, setText] = useState("");
  // [STEP 3 - FLOW: Boolean flag set to true while a send request is in flight,
  //  used to disable the input and send button to prevent duplicate submits.]
  const [sending, setSending] = useState(false);
  // [STEP 4 - FLOW: React ref attached to an empty div at the bottom of the
  //  message list; used to auto-scroll to the latest message.]
  const bottomRef = useRef(null);

  // [STEP 5 - FLOW (useEffect): Polls GET /api/messages every 3 seconds while
  //  the drawer is open and both currentUser.id and recipient.id are present.
  //  Fetches bidirectional messages between the two users and updates state.
  //  Clears the interval on unmount or when the drawer closes.]
  useEffect(() => {
    if (!isOpen || !currentUser?.id || !recipient?.id) return;

    let active = true;
    async function fetchMessages() {
      try {
        // [DATA CALL: fetch GET /api/messages?user1=<currentUser.id>&user2=<recipient.id>
        //  — talks to the /api/messages GET endpoint, which queries public.messages
        //  bidirectionally. Expects { messages: [...] } JSON response.]
        const res = await fetch(
          `/api/messages?user1=${encodeURIComponent(
            currentUser.id
          )}&user2=${encodeURIComponent(recipient.id)}`
        );
        const data = await res.json();
        if (active && res.ok) {
          setMessages(data.messages || []);
        }
      } catch {
        // Silent retry on next poll interval
      }
    }

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isOpen, currentUser?.id, recipient?.id]);

  // [STEP 6 - FLOW (useEffect): Auto-scrolls to the latest message by calling
  //  scrollIntoView on bottomRef whenever the messages array changes.]
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // [STEP 7 - FLOW (handler): Sends a new DM via POST /api/messages. Prevents
  //  form submission, validates text and user IDs, sets sending state, posts
  //  { sender_id, receiver_id, content } to the API, and on success appends the
  //  new message to the list and clears the input.]
  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !currentUser?.id || !recipient?.id) return;
    setSending(true);

    try {
      // [DATA CALL: fetch POST /api/messages — talks to the /api/messages POST
      //  endpoint, which inserts into public.messages. Sends JSON body
      //  { sender_id, receiver_id, content }. Expects { message: {...} } on success.]
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: currentUser.id,
          receiver_id: recipient.id,
          content: text.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setText("");
      }
    } finally {
      setSending(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full flex flex-col border-l border-slate-200 dark:border-slate-800 shadow-2xl animate-drawer">
        {/* Drawer Header */}
        <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-[#0F4C25] text-white">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-[#C59B27]" />
            <div>
              <h3 className="text-sm font-bold leading-tight">
                {recipient?.full_name || "Peer Chat"}
              </h3>
              <p className="text-[11px] text-emerald-100">
                1-on-1 Direct Message
              </p>
            </div>
          </div>

          {/* [UI ELEMENT: CLOSE CHAT DRAWER BUTTON — clicking calls onClose,
           *  which closes the slide-over drawer and clears the chat recipient.] */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950">
          {!currentUser ? (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
              Please sign in to send direct messages.
            </p>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
              No messages yet. Say hello to {recipient?.full_name || "your peer"}!
            </p>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === currentUser.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl px-3.5 py-2 text-sm ${
                      isMine
                        ? "bg-[#0F4C25] text-white rounded-br-xs"
                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-xs"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <span
                      className={`block text-[10px] mt-1 ${
                        isMine ? "text-emerald-200" : "text-slate-400"
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Message Input */}
        <form
          onSubmit={handleSend}
          className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
        >
          {/* [UI ELEMENT: DIRECT MESSAGE INPUT — typing updates the text state
           *  via setText. Disabled when not signed in or while sending.] */}
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!currentUser || sending}
            placeholder={
              currentUser ? "Type a message..." : "Sign in to message"
            }
            className="flex-1 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0F4C25]"
          />

          {/* [UI ELEMENT: SEND DIRECT MESSAGE BUTTON — clicking calls handleSend,
           *  which POSTs the message to /api/messages. Disabled when not signed
           *  in, while sending, or when the input is empty.] */}
          <button
            type="submit"
            disabled={!currentUser || sending || !text.trim()}
            className="p-2.5 rounded-lg bg-[#0F4C25] hover:bg-[#0b3a1c] text-white disabled:opacity-50 transition-colors"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
