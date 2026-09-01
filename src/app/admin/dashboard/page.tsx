import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [userCount, orderCount, pendingPayments, activeProviders] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.provider.count({ where: { status: "ACTIVE" } }),
  ]);

  const stats = [
    { label: "المستخدمون", value: userCount },
    { label: "إجمالي الطلبات", value: orderCount },
    { label: "مدفوعات بانتظار المراجعة", value: pendingPayments },
    { label: "مزودون نشطون", value: activeProviders },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="card">
          <p className="text-sm text-ink-800/60 dark:text-white/50">{s.label}</p>
          <p className="mt-2 font-display text-2xl font-bold">{s.value}</p>
        </div>
      ))}
    </div>
  );
}
