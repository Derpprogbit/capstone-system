// FILE: src/components/ChatDrawer.js
// PURPOSE: Slide-over 1-on-1 direct message drawer between two BSIT students.

'use client';

import { useEffect, useState } from 'react';
import { X, Send } from 'lucide-react';

export default function ChatDrawer({ peer, currentUser, token, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  // Load and poll conversation messages every 4 seconds
  useEffect(() => {
    if (!peer || !token) return;
    async function load() {
      const res = await fetch(`/api/messages?peerId=${peer.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessages(data.messages || []);
    }
    load();
    const timer = setInterval(load, 4000);
    return () => clearInterval(timer);
  }, [peer, token]);

  // Send a new direct message
  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ receiver_id: peer.id, body: text }),
    });
    const data = await res.json();
    if (data.message) setMessages((prev) => [...prev, data.message]);
    setText('');
  }

  if (!peer) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex justify-end">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full border-l border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold">{peer.full_name}</h3>
            <p className="text-[11px] font-mono text-slate-500">Direct Message • {peer.section}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
          {messages.length === 0 && <p className="text-xs text-center text-slate-400 pt-8">No messages yet. Say hello!</p>}
          {messages.map((m) => {
            const mine = m.sender_id === currentUser?.id;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${mine ? 'bg-[#0F4C25] text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  {m.body}
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSend} className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
          {/* Input for typing a direct message */}
          <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
          <button type="submit" className="px-3.5 py-2 rounded-lg bg-[#0F4C25] text-white text-xs font-semibold flex items-center gap-1">
            <Send className="w-3.5 h-3.5" /> Send
          </button>
        </form>
      </div>
    </div>
  );
}