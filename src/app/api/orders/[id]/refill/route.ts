import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getAdapterForProvider } from "@/lib/providers/registry";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireUser();
  if (error) return NextResponse.json({ error }, { status: 401 });

  const order = await prisma.order.findUnique({ where: { id: params.id }, include: { service: true } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const isOwner = order.userId === (session!.user as any).id;
  const isAdmin = ["ADMIN", "OWNER"].includes((session!.user as any).role);
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!order.service.refillSupported) {
    return NextResponse.json({ error: "This service does not support refill." }, { status: 400 });
  }
  if (order.status !== "COMPLETED" && order.status !== "PARTIAL") {
    return NextResponse.json({ error: "Refill is only available for completed or partial orders." }, { status: 409 });
  }
  if (!order.providerOrderId || !order.providerServiceId) {
    return NextResponse.json({ error: "This order has no provider record to refill." }, { status: 400 });
  }
  // Simple cooldown: don't allow repeated refill requests within 24h
  if (order.refillRequestedAt && Date.now() - order.refillRequestedAt.getTime() < 24 * 60 * 60 * 1000) {
    return NextResponse.json({ error: "A refill was already requested for this order recently." }, { status: 429 });
  }

  const mapping = await prisma.providerService.findUnique({
    where: { id: order.providerServiceId },
    include: { provider: true },
  });
  if (!mapping) return NextResponse.json({ error: "Provider mapping missing" }, { status: 500 });

  const adapter = getAdapterForProvider(mapping.provider);
  if (!adapter.requestRefill) {
    return NextResponse.json({ error: "Provider does not support refill." }, { status: 400 });
  }

  try {
    await adapter.requestRefill(order.providerOrderId);
    const updated = await prisma.order.update({ where: { id: order.id }, data: { refillRequestedAt: new Date() } });
    return NextResponse.json({ order: updated });
  } catch (err) {
    console.error("order.refill failed", err);
    return NextResponse.json({ error: "Provider rejected the refill request." }, { status: 502 });
  }
}
