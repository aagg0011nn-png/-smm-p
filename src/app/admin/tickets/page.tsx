"use client";

import { useEffect, useState } from "react";

interface TicketRow {
  id: string;
  subject: string;
  status: string;
  updatedAt: string;
  user: { name: string; email: string };
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch(`/api/admin/tickets${status ? `?status=${status}` : ""}`)
      .then((r) => r.json())
      .then((d) => setTickets(d.tickets ?? []));
  }, [status]);

  return (
    <div className="card overflow-x-auto">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-semibold">التذاكر</h1>
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">كل الحالات</option>
          <option value="OPEN">مفتوحة</option>
          <option value="ANSWERED">تم الرد</option>
          <option value="CLOSED">مغلقة</option>
        </select>
      </div>
      <table className="w-full min-w-[640px] text-right text-sm">
        <thead>
          <tr className="border-b border-black/5 text-ink-800/50 dark:border-white/10 dark:text-white/40">
            <th className="pb-2 font-normal">الموضوع</th>
            <th className="pb-2 font-normal">المستخدم</th>
            <th className="pb-2 font-normal">الحالة</th>
            <th className="pb-2 font-normal">آخر تحديث</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id} className="border-b border-black/5 dark:border-white/5">
              <td className="py-3"><a href={`/admin/tickets/${t.id}`} className="hover:text-brand-500">{t.subject}</a></td>
              <td className="py-3">{t.user.name} <span className="text-ink-800/40 dark:text-white/30">({t.user.email})</span></td>
              <td className="py-3">{t.status}</td>
              <td className="py-3">{new Date(t.updatedAt).toLocaleString("ar")}</td>
            </tr>
          ))}
          {tickets.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-ink-800/40 dark:text-white/30">لا توجد تذاكر.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
