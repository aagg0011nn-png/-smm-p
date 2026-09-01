"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      toast.error(result.error === "ACCOUNT_DISABLED" ? "الحساب معطّل. تواصل مع الدعم." : "البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-6 text-center font-display text-2xl font-bold">تسجيل الدخول</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">البريد الإلكتروني</label>
          <input className="input" id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="password">كلمة المرور</label>
            <a href="/forgot-password" className="mb-1.5 text-xs text-brand-500">نسيت كلمة المرور؟</a>
          </div>
          <input className="input" id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        <button className="btn-primary w-full" disabled={loading} type="submit">
          {loading ? "جارٍ الدخول..." : "دخول"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-800/60 dark:text-white/50">
        ليس لديك حساب؟ <Link href="/signup" className="text-brand-500">إنشاء حساب</Link>
      </p>
    </main>
  );
}
