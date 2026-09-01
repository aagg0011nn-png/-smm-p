"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ServiceItem {
  id: string;
  nameAr: string;
  rate: string;
}
interface CategoryGroup {
  id: string;
  nameAr: string;
  services: ServiceItem[];
}

interface LineResult {
  line: number;
  success: boolean;
  orderId?: string;
  error?: string;
}

export default function MassOrderPage() {
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [raw, setRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<LineResult[] | null>(null);

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then((d) => setCategories(d.categories ?? []));
  }, []);

  async function submit() {
    const lines = raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [serviceId, link, quantity] = l.split("|").map((p) => p.trim());
        return { serviceId, link, quantity: Number(quantity) };
      });

    if (lines.length === 0) {
      toast.error("أضف سطرًا واحدًا على الأقل بالصيغة الصحيحة");
      return;
    }

    setSubmitting(true);
    setResults(null);
    const res = await fetch("/api/orders/mass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      toast.error(data.error ?? "فشل الطلب الجماعي");
      return;
    }
    setResults(data.results);
    const succeeded = data.results.filter((r: LineResult) => r.success).length;
    toast.success(`تم إنشاء ${succeeded} من ${data.results.length} طلب`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="card space-y-4">
        <h1 className="font-semibold">طلب جماعي (Mass Order)</h1>
        <p className="text-sm text-ink-800/60 dark:text-white/50">
          سطر واحد لكل طلب بالصيغة: <code className="rounded bg-black/5 px-1 dark:bg-white/10">معرف_الخدمة|الرابط|الكمية</code>
        </p>
        <textarea
          className="input min-h-[220px] font-mono text-xs"
          placeholder={"cljabc123|https://instagram.com/user1|1000\ncljxyz456|https://instagram.com/user2|500"}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
        />
        <button className="btn-primary" disabled={submitting || !raw.trim()} onClick={submit}>
          {submitting ? "جارٍ الإرسال..." : "إرسال كل الطلبات"}
        </button>

        {results && (
          <div className="mt-4 space-y-1 rounded-lg bg-black/5 p-3 text-sm dark:bg-white/5">
            {results.map((r) => (
              <div key={r.line} className={r.success ? "text-green-600" : "text-red-600"}>
                سطر {r.line}: {r.success ? `تم بنجاح (رقم الطلب: ${r.orderId})` : r.error}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card h-fit">
        <h2 className="mb-3 font-semibold">معرّفات الخدمات</h2>
        <div className="max-h-[400px] space-y-3 overflow-y-auto text-xs">
          {categories.map((cat) => (
            <div key={cat.id}>
              <p className="mb-1 font-medium">{cat.nameAr}</p>
              {cat.services.map((s) => (
                <div key={s.id} className="flex justify-between gap-2 py-1 text-ink-800/60 dark:text-white/50">
                  <span className="truncate">{s.nameAr}</span>
                  <code className="shrink-0">{s.id}</code>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
