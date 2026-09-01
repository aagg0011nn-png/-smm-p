"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Payment {
  id: string;
  amount: string;
  method: string;
  status: string;
  referenceNote: string | null;
  createdAt: string;
  user: { email: string; name: string };
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/payments").then((r) => r.json()).then((d) => setPayments(d.payments ?? []));
  }
  useEffect(load, []);

  async function review(id: string, action: "APPROVE" | "REJECT") {
    setBusyId(id);
    const res = await fetch(`/api/admin/payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setBusyId(null);
    if (!res.ok) {
      toast.error(data.error ?? "فشلت العملية");
      return;
    }
    toast.success(action === "APPROVE" ? "تم اعتماد الدفعة وإضافة الرصيد" : "تم رفض الدفعة");
    load();
  }

  return (
    <div className="card overflow-x-auto">
      <h1 className="mb-4 font-semibold">طلبات الشحن</h1>
      <table className="w-full min-w-[720px] text-right text-sm">
        <thead>
          <tr className="border-b border-black/5 text-ink-800/50 dark:border-white/10 dark:text-white/40">
            <th className="pb-2 font-normal">المستخدم</th>
            <th className="pb-2 font-normal">المبلغ</th>
            <th className="pb-2 font-normal">الطريقة</th>
            <th className="pb-2 font-normal">ملاحظة</th>
            <th className="pb-2 font-normal">الحالة</th>
            <th className="pb-2 font-normal"></th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id} className="border-b border-black/5 dark:border-white/5">
              <td className="py-3">{p.user.name} <span className="text-ink-800/40 dark:text-white/30">({p.user.email})</span></td>
              <td className="py-3">${Number(p.amount).toFixed(2)}</td>
              <td className="py-3">{p.method}</td>
              <td className="py-3">{p.referenceNote ?? "-"}</td>
              <td className="py-3">{p.status}</td>
              <td className="py-3 space-x-2 space-x-reverse">
                {p.status === "PENDING" && (
                  <>
                    <button disabled={busyId === p.id} onClick={() => review(p.id, "APPROVE")} className="text-green-600">اعتماد</button>
                    <button disabled={busyId === p.id} onClick={() => review(p.id, "REJECT")} className="text-red-600">رفض</button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {payments.length === 0 && (
            <tr><td colSpan={6} className="py-6 text-center text-ink-800/40 dark:text-white/30">لا توجد طلبات شحن.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
