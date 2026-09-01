"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  balance: string;
  _count: { orders: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");

  function load() {
    fetch(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`)
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []));
  }
  useEffect(load, []);

  async function toggleStatus(u: UserRow) {
    const next = u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) {
      toast.error("فشل التحديث");
      return;
    }
    toast.success(next === "SUSPENDED" ? "تم تعليق الحساب" : "تم تفعيل الحساب");
    load();
  }

  return (
    <div className="card overflow-x-auto">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-semibold">المستخدمون</h1>
        <div className="flex gap-2">
          <input className="input w-56" placeholder="بحث بالاسم أو البريد" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn-secondary" onClick={load}>بحث</button>
        </div>
      </div>
      <table className="w-full min-w-[720px] text-right text-sm">
        <thead>
          <tr className="border-b border-black/5 text-ink-800/50 dark:border-white/10 dark:text-white/40">
            <th className="pb-2 font-normal">الاسم</th>
            <th className="pb-2 font-normal">البريد</th>
            <th className="pb-2 font-normal">الدور</th>
            <th className="pb-2 font-normal">الرصيد</th>
            <th className="pb-2 font-normal">الطلبات</th>
            <th className="pb-2 font-normal">الحالة</th>
            <th className="pb-2 font-normal"></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-black/5 dark:border-white/5">
              <td className="py-3">{u.name}</td>
              <td className="py-3">{u.email}</td>
              <td className="py-3">{u.role}</td>
              <td className="py-3">${Number(u.balance).toFixed(2)}</td>
              <td className="py-3">{u._count.orders}</td>
              <td className="py-3">{u.status}</td>
              <td className="py-3">
                <button onClick={() => toggleStatus(u)} className={u.status === "ACTIVE" ? "text-red-600" : "text-green-600"}>
                  {u.status === "ACTIVE" ? "تعليق" : "تفعيل"}
                </button>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr><td colSpan={7} className="py-6 text-center text-ink-800/40 dark:text-white/30">لا يوجد مستخدمون.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
