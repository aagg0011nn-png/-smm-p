import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncOrderStatus } from "@/lib/order-engine";

// Intended to be triggered by an external scheduler (cron, systemd timer,
// Vercel Cron, etc.) hitting this route every few minutes — NOT by a user.
// Protect it with a shared secret header rather than a user session.
export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeOrders = await prisma.order.findMany({
    where: { status: { in: ["PENDING", "PROCESSING", "IN_PROGRESS"] } },
    select: { id: true },
    take: 200, // batch size per run; call repeatedly / paginate for larger volumes
  });

  const results = await Promise.allSettled(activeOrders.map((o) => syncOrderStatus(o.id)));
  const succeeded = results.filter((r) => r.status === "fulfilled").length;

  return NextResponse.json({ checked: activeOrders.length, succeeded, failed: activeOrders.length - succeeded });
}
