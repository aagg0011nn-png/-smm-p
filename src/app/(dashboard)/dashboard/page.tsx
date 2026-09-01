import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as any).id as string;

  const [user, recentOrders, orderCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { balance: true } }),
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { service: { select: { nameAr: true } } },
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-ink-800/60 dark:text-white/50">الرصيد الحالي</p>
          <p className="mt-2 font-display text-2xl font-bold text-brand-500">${Number(user?.balance ?? 0).toFixed(2)}</p>
          <Link href="/wallet" className="mt-3 inline-block text-sm text-brand-500">شحن الرصيد ←</Link>
        </div>
        <div className="card">
          <p className="text-sm text-ink-800/60 dark:text-white/50">إجمالي الطلبات</p>
          <p className="mt-2 font-display text-2xl font-bold">{orderCount}</p>
          <Link href="/orders" className="mt-3 inline-block text-sm text-brand-500">عرض الكل ←</Link>
        </div>
        <div className="card">
          <p className="text-sm text-ink-800/60 dark:text-white/50">طلب جديد</p>
          <p className="mt-1 text-sm text-ink-800/60 dark:text-white/50">اختر خدمة وابدأ فورًا</p>
          <Link href="/services" className="btn-primary mt-3 inline-flex">تصفح الخدمات</Link>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 font-semibold">آخر الطلبات</h2>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-ink-800/50 dark:text-white/40">لا توجد طلبات بعد.</p>
        ) : (
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {recentOrders.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-3 text-sm">
                <span>{o.service.nameAr}</span>
                <span className="text-ink-800/50 dark:text-white/40">{o.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
