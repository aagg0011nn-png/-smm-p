"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Provider {
  id: string;
  name: string;
  apiUrl: string;
  status: string;
  balance: string | null;
  lastSyncedAt: string | null;
  _count: { services: number };
}

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [form, setForm] = useState({ name: "", apiUrl: "", apiKey: "" });
  const [submitting, setSubmitting] = useState(false);

  function load() {
    fetch("/api/admin/providers").then((r) => r.json()).then((d) => setProviders(d.providers ?? []));
  }
  useEffect(load, []);

  async function addProvider() {
    setSubmitting(true);
    const res = await fetch("/api/admin/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      toast.error(data.error ?? "فشلت الإضافة");
      return;
    }
    if (data.warning) toast.warning(data.warning);
    else toast.success("تم إضافة المزود واختبار الاتصال بنجاح");
    setForm({ name: "", apiUrl: "", apiKey: "" });
    load();
  }

  async function importServices(id: string) {
    const res = await fetch(`/api/admin/providers/${id}/import`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "فشل الاستيراد");
      return;
    }
    toast.success(`تم استيراد ${data.importedCount} خدمة. أكمل الربط من صفحة الخدمات.`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="card overflow-x-auto">
        <h1 className="mb-4 font-semibold">المزودون</h1>
        <table className="w-full min-w-[560px] text-right text-sm">
          <thead>
            <tr className="border-b border-black/5 text-ink-800/50 dark:border-white/10 dark:text-white/40">
              <th className="pb-2 font-normal">الاسم</th>
              <th className="pb-2 font-normal">الحالة</th>
              <th className="pb-2 font-normal">الرصيد</th>
              <th className="pb-2 font-normal">الخدمات المربوطة</th>
              <th className="pb-2 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => (
              <tr key={p.id} className="border-b border-black/5 dark:border-white/5">
                <td className="py-3">{p.name}</td>
                <td className="py-3">{p.status}</td>
                <td className="py-3">{p.balance ?? "-"}</td>
                <td className="py-3">{p._count.services}</td>
                <td className="py-3">
                  <button onClick={() => importServices(p.id)} className="text-brand-500">استيراد الخدمات</button>
                </td>
              </tr>
            ))}
            {providers.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-ink-800/40 dark:text-white/30">لا يوجد مزودون بعد.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card h-fit">
        <h2 className="mb-4 font-semibold">إضافة مزود جديد</h2>
        <div className="space-y-3">
          <input className="input" placeholder="اسم المزود" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="رابط الـ API" value={form.apiUrl} onChange={(e) => setForm({ ...form, apiUrl: e.target.value })} />
          <input className="input" placeholder="مفتاح الـ API" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} />
          <button className="btn-primary w-full" disabled={submitting || !form.name || !form.apiUrl || !form.apiKey} onClick={addProvider}>
            {submitting ? "جارٍ الاختبار..." : "إضافة واختبار الاتصال"}
          </button>
        </div>
      </div>
    </div>
  );
}
