import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderSyncButton } from "@/components/dashboard/order-sync-button";

const statusLabel: Record<string, string> = {
  PENDING: "قيد الانتظار",
  PROCESSING: "قيد المعالجة",
  IN_PROGRESS: "جارٍ التنفيذ",
  COMPLETED: "مكتمل",
  PARTIAL: "جزئي",
  CANCELED: "ملغي",
  REFUNDED: "مسترجع",
  FAILED: "فشل",
};

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  const orders = await prisma.order.findMany({
    where: { userId: (session!.user as any).id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { service: { select: { nameAr: true } } },
  });

  return (
    <div className="card overflow-x-auto">
      <h1 className="mb-4 font-semibold">طلباتي</h1>
      <table className="w-full min-w-[640px] text-right text-sm">
        <thead>
          <tr className="border-b border-black/5 text-ink-800/50 dark:border-white/10 dark:text-white/40">
            <th className="pb-2 font-normal">الخدمة</th>
            <th className="pb-2 font-normal">الكمية</th>
            <th className="pb-2 font-normal">السعر</th>
            <th className="pb-2 font-normal">الحالة</th>
            <th className="pb-2 font-normal">المتبقي</th>
            <th className="pb-2 font-normal"></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-black/5 dark:border-white/5">
              <td className="py-3">
                <a href={`/orders/${o.id}`} className="hover:text-brand-500">{o.service.nameAr}</a>
              </td>
              <td className="py-3">{o.quantity.toLocaleString("ar")}</td>
              <td className="py-3">${Number(o.charge).toFixed(2)}</td>
              <td className="py-3">{statusLabel[o.status] ?? o.status}</td>
              <td className="py-3">{o.remains ?? "-"}</td>
              <td className="py-3"><OrderSyncButton orderId={o.id} /></td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr><td colSpan={6} className="py-6 text-center text-ink-800/40 dark:text-white/30">لا توجد طلبات بعد.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
