import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getAdapterForProvider } from "@/lib/providers/registry";
import { refundOrder } from "@/lib/order-engine";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireUser();
  if (error) return NextResponse.json({ error }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      service: true,
      user: { select: { id: true } },
    },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const isOwner = order.userId === (session!.user as any).id;
  const isAdmin = ["ADMIN", "OWNER"].includes((session!.user as any).role);
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!order.service.cancelSupported) {
    return NextResponse.json({ error: "This service does not support cancellation." }, { status: 400 });
  }
  if (!["PENDING", "PROCESSING", "IN_PROGRESS"].includes(order.status)) {
    return NextResponse.json({ error: "Order can no longer be canceled." }, { status: 409 });
  }
  if (!order.providerOrderId) {
    // Never dispatched to a provider yet - just refund directly.
    const refunded = await refundOrder(order.id, "Canceled before dispatch", "CANCELED");
    return NextResponse.json({ order: refunded });
  }

  const mapping = await prisma.providerService.findUnique({
    where: { id: order.providerServiceId! },
    include: { provider: true },
  });
  if (!mapping) return NextResponse.json({ error: "Provider mapping missing" }, { status: 500 });

  const adapter = getAdapterForProvider(mapping.provider);
  if (!adapter.requestCancel) {
    return NextResponse.json({ error: "Provider does not support cancellation." }, { status: 400 });
  }

  try {
    await adapter.requestCancel(order.providerOrderId);
    const refunded = await refundOrder(order.id, "Canceled by request", "CANCELED");
    return NextResponse.json({ order: refunded });
  } catch (err) {
    console.error("order.cancel failed", err);
    return NextResponse.json({ error: "Provider rejected the cancellation request." }, { status: 502 });
  }
}
