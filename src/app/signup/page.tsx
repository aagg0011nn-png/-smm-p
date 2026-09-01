"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
    };

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error ?? "حدث خطأ ما.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      toast.success("تم إنشاء الحساب. سجّل الدخول للمتابعة.");
      router.push("/login");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-6 text-center font-display text-2xl font-bold">إنشاء حساب</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="name">الاسم</label>
          <input className="input" id="name" name="name" required minLength={2} />
        </div>
        <div>
          <label className="label" htmlFor="email">البريد الإلكتروني</label>
          <input className="input" id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">كلمة المرور</label>
          <input className="input" id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
          <p className="mt-1 text-xs text-ink-800/50 dark:text-white/40">8 أحرف على الأقل، تتضمن حرف كبير ورقم.</p>
        </div>
        <button className="btn-primary w-full" disabled={loading} type="submit">
          {loading ? "جارٍ الإنشاء..." : "إنشاء الحساب"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-800/60 dark:text-white/50">
        لديك حساب بالفعل؟ <Link href="/login" className="text-brand-500">تسجيل الدخول</Link>
      </p>
    </main>
  );
}
