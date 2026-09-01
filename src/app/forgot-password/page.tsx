"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-6 text-center font-display text-2xl font-bold">استعادة كلمة المرور</h1>
      {sent ? (
        <div className="card text-center text-sm">
          إذا كان هذا البريد مسجّلاً لدينا، سيصلك رابط لإعادة تعيين كلمة المرور خلال دقائق.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">البريد الإلكتروني</label>
            <input className="input" id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className="btn-primary w-full" disabled={loading} type="submit">
            {loading ? "جارٍ الإرسال..." : "إرسال رابط الاستعادة"}
          </button>
        </form>
      )}
      <p className="mt-4 text-center text-sm text-ink-800/60 dark:text-white/50">
        <Link href="/login" className="text-brand-500">العودة لتسجيل الدخول</Link>
      </p>
    </main>
  );
}
