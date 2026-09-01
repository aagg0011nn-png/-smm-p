import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { syncOrderStatus } from "@/lib/order-engine";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireUser();
  if (error) return NextResponse.json({ error }, { status: 401 });

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const isOwner = order.userId === (session!.user as any).id;
  const isAdmin = ["ADMIN", "OWNER"].includes((session!.user as any).role);
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const updated = await syncOrderStatus(order.id);
    return NextResponse.json({ order: updated });
  } catch (err) {
    console.error("order.sync failed", err);
    return NextResponse.json({ error: "Could not reach provider to sync status." }, { status: 502 });
  }
}
