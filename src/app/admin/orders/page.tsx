"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface OrderRow {
  id: string;
  quantity: number;
  charge: string;
  status: string;
  remains: number | null;
  createdAt: string;
  user: { name: string; email: string };
  service: { nameAr: string };
}

const statuses = ["", "PENDING", "PROCESSING", "IN_PROGRESS", "COMPLETED", "PARTIAL", "CANCELED", "REFUNDED", "FAILED"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [status, setStatus] = useState("");
  const [syncingAll, setSyncingAll] = useState(false);

  function load() {
    fetch(`/api/admin/orders${status ? `?status=${status}` : ""}`)
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []));
  }
  useEffect(load, [status]);

  async function syncAll() {
    setSyncingAll(true);
    const res = await fetch("/api/admin/orders/sync-all", {
      method: "POST",
      headers: { "x-cron-secret": prompt("أدخل CRON_SECRET (من متغيرات البيئة) للتأكيد:") ?? "" },
    });
    setSyncingAll(false);
    if (!res.ok) {
      toast.error("فشلت المزامنة");
      return;
    }
    const data = await res.json();
    toast.success(`تمت مزامنة ${data.succeeded} من ${data.checked} طلب`);
    load();
  }

  return (
    <div className="card overflow-x-auto">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-semibold">الطلبات</h1>
        <div className="flex items-center gap-2">
          <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            {statuses.map((s) => (
              <option key={s} value={s}>{s || "كل الحالات"}</option>
            ))}
          </select>
          <button className="btn-secondary" disabled={syncingAll} onClick={syncAll}>مزامنة الحالات الآن</button>
        </div>
      </div>
      <table className="w-full min-w-[760px] text-right text-sm">
        <thead>
          <tr className="border-b border-black/5 text-ink-800/50 dark:border-white/10 dark:text-white/40">
            <th className="pb-2 font-normal">المستخدم</th>
            <th className="pb-2 font-normal">الخدمة</th>
            <th className="pb-2 font-normal">الكمية</th>
            <th className="pb-2 font-normal">القيمة</th>
            <th className="pb-2 font-normal">الحالة</th>
            <th className="pb-2 font-normal">المتبقي</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-black/5 dark:border-white/5">
              <td className="py-3">{o.user.name}</td>
              <td className="py-3">{o.service.nameAr}</td>
              <td className="py-3">{o.quantity.toLocaleString("ar")}</td>
              <td className="py-3">${Number(o.charge).toFixed(2)}</td>
              <td className="py-3">{o.status}</td>
              <td className="py-3">{o.remains ?? "-"}</td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr><td colSpan={6} className="py-6 text-center text-ink-800/40 dark:text-white/30">لا توجد طلبات مطابقة.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
