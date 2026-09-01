"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";

export default function ApiAccessPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [siteUrl, setSiteUrl] = useState("");

  useEffect(() => {
    setSiteUrl(window.location.origin);
    fetch("/api/user/api-key").then((r) => r.json()).then((d) => setApiKey(d.apiKey));
  }, []);

  async function generate() {
    setLoading(true);
    const res = await fetch("/api/user/api-key", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    setApiKey(data.apiKey);
    toast.success("تم توليد مفتاح جديد. المفتاح القديم لم يعد صالحًا.");
  }

  function copy() {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    toast.success("تم النسخ");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="card">
        <h1 className="mb-4 font-semibold">API الخاص بك</h1>
        {apiKey ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-black/5 px-3 py-2 text-sm dark:bg-white/10">{apiKey}</code>
            <button onClick={copy} className="btn-secondary" aria-label="نسخ"><Copy size={16} /></button>
          </div>
        ) : (
          <p className="text-sm text-ink-800/50 dark:text-white/40">لا يوجد مفتاح بعد.</p>
        )}
        <button className="btn-primary mt-4" disabled={loading} onClick={generate}>
          {loading ? "جارٍ التوليد..." : apiKey ? "توليد مفتاح جديد (يلغي القديم)" : "توليد مفتاح API"}
        </button>
      </div>

      <div className="card space-y-4 text-sm">
        <h2 className="font-semibold">التوثيق</h2>
        <p className="text-ink-800/60 dark:text-white/50">
          نقطة الوصول: <code className="rounded bg-black/5 px-1 dark:bg-white/10">POST {siteUrl}/api/v2</code> — الطلبات form-urlencoded، ويجب تضمين مفتاحك في حقل <code>key</code>.
        </p>

        <div>
          <p className="mb-1 font-medium">جلب الرصيد</p>
          <pre className="overflow-x-auto rounded-lg bg-black/5 p-3 text-xs dark:bg-white/10">{`curl -X POST ${siteUrl}/api/v2 \\
  -d "key=${apiKey ?? "YOUR_API_KEY"}" \\
  -d "action=balance"`}</pre>
        </div>

        <div>
          <p className="mb-1 font-medium">جلب قائمة الخدمات</p>
          <pre className="overflow-x-auto rounded-lg bg-black/5 p-3 text-xs dark:bg-white/10">{`curl -X POST ${siteUrl}/api/v2 \\
  -d "key=${apiKey ?? "YOUR_API_KEY"}" \\
  -d "action=services"`}</pre>
        </div>

        <div>
          <p className="mb-1 font-medium">إنشاء طلب</p>
          <pre className="overflow-x-auto rounded-lg bg-black/5 p-3 text-xs dark:bg-white/10">{`curl -X POST ${siteUrl}/api/v2 \\
  -d "key=${apiKey ?? "YOUR_API_KEY"}" \\
  -d "action=add" \\
  -d "service=SERVICE_ID" \\
  -d "link=https://instagram.com/username" \\
  -d "quantity=1000"`}</pre>
        </div>

        <div>
          <p className="mb-1 font-medium">استعلام حالة الطلب</p>
          <pre className="overflow-x-auto rounded-lg bg-black/5 p-3 text-xs dark:bg-white/10">{`curl -X POST ${siteUrl}/api/v2 \\
  -d "key=${apiKey ?? "YOUR_API_KEY"}" \\
  -d "action=status" \\
  -d "order=ORDER_ID"`}</pre>
        </div>
      </div>
    </div>
  );
}
