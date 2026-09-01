"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const CANCELABLE = new Set(["PENDING", "PROCESSING", "IN_PROGRESS"]);
const REFILLABLE = new Set(["COMPLETED", "PARTIAL"]);

export function OrderActions({
  orderId,
  status,
  cancelSupported,
  refillSupported,
}: {
  orderId: string;
  status: string;
  cancelSupported: boolean;
  refillSupported: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function call(action: "sync" | "cancel" | "refill") {
    setBusy(action);
    const res = await fetch(`/api/orders/${orderId}/${action}`, { method: "POST" });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) {
      toast.error(data.error ?? "فشلت العملية");
      return;
    }
    toast.success(action === "sync" ? "تم تحديث الحالة" : action === "cancel" ? "تم إلغاء الطلب واسترجاع المبلغ" : "تم إرسال طلب إعادة التعبئة");
    router.refresh();
  }

  return (
    <div className="card flex flex-wrap gap-3">
      <button className="btn-secondary" disabled={busy !== null} onClick={() => call("sync")}>
        {busy === "sync" ? "جارٍ التحديث..." : "تحديث الحالة"}
      </button>
      {cancelSupported && CANCELABLE.has(status) && (
        <button className="btn-secondary text-red-600" disabled={busy !== null} onClick={() => call("cancel")}>
          {busy === "cancel" ? "جارٍ الإلغاء..." : "إلغاء الطلب"}
        </button>
      )}
      {refillSupported && REFILLABLE.has(status) && (
        <button className="btn-secondary text-brand-500" disabled={busy !== null} onClick={() => call("refill")}>
          {busy === "refill" ? "جارٍ الإرسال..." : "طلب إعادة تعبئة (Refill)"}
        </button>
      )}
    </div>
  );
}
