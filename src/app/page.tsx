import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, Zap, ShieldCheck, Clock } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white dark:bg-ink-950">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="font-display text-lg font-bold">{process.env.NEXT_PUBLIC_SITE_NAME ?? "SMM Panel"}</span>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className="btn-secondary">تسجيل الدخول</Link>
          <Link href="/signup" className="btn-primary">إنشاء حساب</Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-16 pt-10 text-center">
        <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
          نمو حقيقي لحساباتك على السوشيال ميديا،
          <br />
          <span className="text-brand-500">بضغطة واحدة</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-800/70 dark:text-white/60">
          متابعين، لايكات، مشاهدات — أسعار تنافسية، تنفيذ سريع، ودعم فني متواصل لكل منصاتك المفضلة.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/signup" className="btn-primary gap-2">
            ابدأ الآن <ArrowLeft size={16} />
          </Link>
          <Link href="/services" className="btn-secondary">تصفح الخدمات</Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-20 sm:grid-cols-3">
        {[
          { icon: Zap, title: "تنفيذ سريع", desc: "معالجة فورية للطلبات مباشرة عبر مزودين موثوقين." },
          { icon: ShieldCheck, title: "أمان أولًا", desc: "بياناتك ومدفوعاتك محمية بأعلى معايير الأمان." },
          { icon: Clock, title: "دعم 24/7", desc: "فريق دعم فني جاهز للرد على استفساراتك في أي وقت." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card">
            <Icon className="text-brand-500" size={22} />
            <h3 className="mt-3 font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-ink-800/60 dark:text-white/50">{desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
