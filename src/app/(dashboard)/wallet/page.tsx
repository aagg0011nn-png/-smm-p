"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function WalletPage() {
  const [amount, setAmount] = useState<number>(0);
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitDeposit() {
    setSubmitting(true);
    const res = await fetch("/api/wallet/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, method: "MANUAL_BANK_TRANSFER", referenceNote: reference }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      toast.error(data.error ?? "فشل تقديم الطلب");
      return;
    }
    toast.success("تم إرسال طلب الشحن، بانتظار موافقة الإدارة.");
    setAmount(0);
    setReference("");
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="card">
        <h1 className="mb-4 font-semibold">شحن الرصيد — تحويل بنكي يدوي</h1>
        <div className="mb-4 rounded-lg bg-black/5 p-3 text-sm dark:bg-white/5">
          حوّل المبلغ إلى الحساب البنكي التالي ثم أرسل رقم العملية أدناه ليتم مراجعته من فريق الإدارة:
          <br />
          <span className="font-mono">IBAN: SA00 0000 0000 0000 0000 0000</span>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">المبلغ ($)</label>
            <input type="number" className="input" value={amount} min={1} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">رقم العملية / ملاحظة</label>
            <input className="input" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="مثال: رقم التحويل" />
          </div>
          <button className="btn-primary w-full" disabled={submitting || amount <= 0} onClick={submitDeposit}>
            {submitting ? "جارٍ الإرسال..." : "إرسال طلب الشحن"}
          </button>
        </div>
      </div>
    </div>
  );
}
