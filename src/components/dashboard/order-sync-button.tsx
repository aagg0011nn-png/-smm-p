"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function OrderSyncButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function sync() {
    setLoading(true);
    await fetch(`/api/orders/${orderId}/sync`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={sync} disabled={loading} className="text-ink-800/40 hover:text-brand-500 dark:text-white/30" aria-label="تحديث الحالة">
      <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
    </button>
  );
}
