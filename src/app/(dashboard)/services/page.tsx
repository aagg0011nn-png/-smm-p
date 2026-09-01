"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ServiceItem {
  id: string;
  nameAr: string;
  min: number;
  max: number;
  rate: string;
  description: string | null;
}
interface CategoryGroup {
  id: string;
  nameAr: string;
  services: ServiceItem[];
}

export default function ServicesPage() {
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [selected, setSelected] = useState<ServiceItem | null>(null);
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []));
  }, []);

  const estimatedCharge = selected ? ((Number(selected.rate) * quantity) / 1000).toFixed(4) : "0.0000";

  async function submitOrder() {
    if (!selected) return;
    setSubmitting(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId: selected.id, link, quantity }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      toast.error(data.error ?? "فشل إنشاء الطلب");
      return;
    }
    toast.success("تم إنشاء الطلب بنجاح!");
    setSelected(null);
    setLink("");
    setQuantity(0);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        {categories.map((cat) => (
          <div key={cat.id} className="card">
            <h2 className="mb-3 font-semibold">{cat.nameAr}</h2>
            <div className="space-y-2">
              {cat.services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelected(s);
                    setQuantity(s.min);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-right text-sm transition-colors ${
                    selected?.id === s.id
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                      : "border-black/5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                  }`}
                >
                  <span>{s.nameAr}</span>
                  <span className="text-ink-800/50 dark:text-white/40">${s.rate} / 1000</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {categories.length === 0 && <p className="text-sm text-ink-800/50 dark:text-white/40">جارٍ تحميل الخدمات...</p>}
      </div>

      <div className="card h-fit sticky top-6">
        <h2 className="mb-4 font-semibold">طلب جديد</h2>
        {!selected ? (
          <p className="text-sm text-ink-800/50 dark:text-white/40">اختر خدمة من القائمة لبدء الطلب.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-medium">{selected.nameAr}</p>
            <div>
              <label className="label">الرابط</label>
              <input className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" />
            </div>
            <div>
              <label className="label">الكمية (من {selected.min} إلى {selected.max})</label>
              <input
                type="number"
                className="input"
                value={quantity}
                min={selected.min}
                max={selected.max}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>
            <div className="rounded-lg bg-black/5 px-3 py-2 text-sm dark:bg-white/5">
              التكلفة التقديرية: <span className="font-semibold text-brand-500">${estimatedCharge}</span>
            </div>
            <button className="btn-primary w-full" disabled={submitting || !link || quantity < selected.min} onClick={submitOrder}>
              {submitting ? "جارٍ الإرسال..." : "تأكيد الطلب"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
