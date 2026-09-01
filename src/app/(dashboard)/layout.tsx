import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { LayoutDashboard, ListOrdered, ShoppingCart, Wallet, LifeBuoy, LogOut, Layers, Code2 } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
export const dynamic = "force-dynamic";

const navItems = [
  { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/services", label: "الخدمات", icon: ShoppingCart },
  { href: "/mass-order", label: "طلب جماعي", icon: Layers },
  { href: "/orders", label: "طلباتي", icon: ListOrdered },
  { href: "/wallet", label: "الرصيد", icon: Wallet },
  { href: "/api-access", label: "API", icon: Code2 },
  { href: "/tickets", label: "الدعم الفني", icon: LifeBuoy },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-l border-black/5 bg-white p-4 dark:border-white/10 dark:bg-ink-900 md:block">
        <div className="mb-6 px-2 font-display text-lg font-bold">{process.env.NEXT_PUBLIC_SITE_NAME ?? "SMM Panel"}</div>
        <nav className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-800/80 transition-colors hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/5"
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-black/5 px-6 py-4 dark:border-white/10">
          <div className="text-sm text-ink-800/60 dark:text-white/50">مرحبًا، {session.user.name}</div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
