"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  updatedAt: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    fetch("/api/tickets").then((r) => r.json()).then((d) => setTickets(d.tickets ?? []));
  }
  useEffect(load, []);

  async function submit() {
    setSubmitting(true);
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message }),
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error("فشل إرسال التذكرة");
      return;
    }
    toast.success("تم فتح التذكرة");
    setSubject("");
    setMessage("");
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="card">
        <h1 className="mb-4 font-semibold">تذاكري</h1>
        <ul className="divide-y divide-black/5 dark:divide-white/10">
          {tickets.map((t) => (
            <li key={t.id}>
              <a href={`/tickets/${t.id}`} className="flex items-center justify-between py-3 text-sm hover:text-brand-500">
                <span>{t.subject}</span>
                <span className="text-ink-800/50 dark:text-white/40">{t.status}</span>
              </a>
            </li>
          ))}
          {tickets.length === 0 && <p className="py-6 text-center text-sm text-ink-800/40 dark:text-white/30">لا توجد تذاكر بعد.</p>}
        </ul>
      </div>
      <div className="card h-fit">
        <h2 className="mb-4 font-semibold">فتح تذكرة جديدة</h2>
        <div className="space-y-3">
          <input className="input" placeholder="الموضوع" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <textarea className="input min-h-[100px]" placeholder="الرسالة" value={message} onChange={(e) => setMessage(e.target.value)} />
          <button className="btn-primary w-full" disabled={submitting || !subject || !message} onClick={submit}>
            {submitting ? "جارٍ الإرسال..." : "إرسال"}
          </button>
        </div>
      </div>
    </div>
  );
}
