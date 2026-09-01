"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

interface Message {
  id: string;
  body: string;
  isStaff: boolean;
  createdAt: string;
  user: { name: string };
}
interface TicketDetail {
  id: string;
  subject: string;
  status: string;
  messages: Message[];
}

export default function TicketThreadPage() {
  const params = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  function load() {
    fetch(`/api/tickets/${params.id}`).then((r) => r.json()).then((d) => setTicket(d.ticket ?? null));
  }
  useEffect(load, [params.id]);

  async function send() {
    setSending(true);
    const res = await fetch(`/api/tickets/${params.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: reply }),
    });
    setSending(false);
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error ?? "فشل الإرسال");
      return;
    }
    setReply("");
    load();
  }

  if (!ticket) return <p className="text-sm text-ink-800/50 dark:text-white/40">جارٍ التحميل...</p>;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-semibold">{ticket.subject}</h1>
          <span className="text-sm text-ink-800/50 dark:text-white/40">{ticket.status}</span>
        </div>
        <div className="space-y-3">
          {ticket.messages.map((m) => (
            <div key={m.id} className={`rounded-lg p-3 text-sm ${m.isStaff ? "bg-brand-50 dark:bg-brand-500/10" : "bg-black/5 dark:bg-white/5"}`}>
              <p className="mb-1 text-xs font-medium text-ink-800/50 dark:text-white/40">
                {m.isStaff ? "فريق الدعم" : m.user.name}
              </p>
              <p>{m.body}</p>
            </div>
          ))}
        </div>
      </div>

      {ticket.status !== "CLOSED" && (
        <div className="card space-y-3">
          <textarea className="input min-h-[100px]" placeholder="اكتب ردك..." value={reply} onChange={(e) => setReply(e.target.value)} />
          <button className="btn-primary" disabled={sending || !reply.trim()} onClick={send}>
            {sending ? "جارٍ الإرسال..." : "إرسال الرد"}
          </button>
        </div>
      )}
    </div>
  );
}
