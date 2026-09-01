import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderActions } from "@/components/dashboard/order-actions";

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

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { service: true },
  });
  if (!order) notFound();

  const isOwner = order.userId === (session.user as any).id;
  const isAdmin = ["ADMIN", "OWNER"].includes((session.user as any).role);
  if (!isOwner && !isAdmin) redirect("/orders");

  const rows: [string, string][] = [
    ["رقم الطلب", order.id],
    ["الخدمة", order.service.nameAr],
    ["الرابط", order.link],
    ["الكمية", order.quantity.toLocaleString("ar")],
    ["البداية", order.startCount?.toString() ?? "-"],
    ["المتبقي", order.remains?.toString() ?? "-"],
    ["السعر", `$${Number(order.charge).toFixed(4)}`],
    ["الحالة", statusLabel[order.status] ?? order.status],
    ["تاريخ الإنشاء", new Date(order.createdAt).toLocaleString("ar")],
  ];
  if (order.failureReason) rows.push(["سبب الفشل/الإلغاء", order.failureReason]);

  return (
    <div className="max-w-2xl space-y-4">
      <div className="card">
        <h1 className="mb-4 font-semibold">تفاصيل الطلب</h1>
        <dl className="divide-y divide-black/5 text-sm dark:divide-white/10">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-2.5">
              <dt className="text-ink-800/50 dark:text-white/40">{label}</dt>
              <dd className="max-w-[60%] break-all text-left">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <OrderActions
        orderId={order.id}
        status={order.status}
        cancelSupported={order.service.cancelSupported}
        refillSupported={order.service.refillSupported}
      />
    </div>
  );
}
