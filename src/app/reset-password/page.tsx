"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "فشلت العملية");
      return;
    }
    toast.success("تم تحديث كلمة المرور، سجّل الدخول الآن.");
    router.push("/login");
  }

  if (!token) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 text-center text-sm">
        رابط غير صالح. اطلب رابط استعادة جديد من صفحة تسجيل الدخول.
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-6 text-center font-display text-2xl font-bold">تعيين كلمة مرور جديدة</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="password">كلمة المرور الجديدة</label>
          <input className="input" id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="mt-1 text-xs text-ink-800/50 dark:text-white/40">8 أحرف على الأقل، تتضمن حرف كبير ورقم.</p>
        </div>
        <button className="btn-primary w-full" disabled={loading} type="submit">
          {loading ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}
        </button>
      </form>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    
