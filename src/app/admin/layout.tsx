import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LayoutDashboard, Server, Users, ListOrdered, Wallet, LifeBuoy, Newspaper } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
export const dynamic = "force-dynamic";

const navItems = [
  { href: "/admin/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/admin/providers", label: "المزودون", icon: Server },
  { href: "/admin/orders", label: "الطلبات", icon: ListOrdered },
  { href: "/admin/users", label: "المستخدمون", icon: Users },
  { href: "/admin/payments", label: "المدفوعات", icon: Wallet },
  { href: "/admin/tickets", label: "التذاكر", icon: LifeBuoy },
  { href: "/admin/blog", label: "المدونة", icon: Newspaper },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || !["ADMIN", "OWNER", "SUPPORT"].includes(role)) redirect("/dashboard");

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-l border-black/5 bg-ink-950 p-4 text-white md:block">
        <div className="mb-6 px-2 font-display text-lg font-bold">لوحة الإدارة</div>
        <nav className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10">
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-black/5 px-6 py-4 dark:border-white/10">
          <span className="text-sm text-ink-800/60 dark:text-white/50">{session.user.name} · {role}</span>
          <SignOutButton />
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
