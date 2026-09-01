import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createOrderSchema } from "@/lib/validation";
import { placeOrder, OrderEngineError } from "@/lib/order-engine";
import { rateLimit, getClientKey } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const { session, error } = await requireUser();
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = 20;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId: (session!.user as any).id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { service: { select: { name: true, nameAr: true } } },
    }),
    prisma.order.count({ where: { userId: (session!.user as any).id } }),
  ]);

  return NextResponse.json({ orders, total, page, pageSize });
}

export async function POST(req: Request) {
  const { session, error } = await requireUser();
  if (error) return NextResponse.json({ error }, { status: 401 });

  const userId = (session!.user as any).id as string;

  const { allowed } = rateLimit(`order:${userId}`, 30, 60_000); // 30 orders / minute
  if (!allowed) {
    return NextResponse.json({ error: "Too many orders submitted. Slow down and try again." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  try {
    const { order } = await placeOrder({ userId, ...parsed.data });
    await prisma.activityLog.create({
      data: { userId, action: "order.create", metadata: { orderId: order.id }, ip: getClientKey(req) },
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    if (err instanceof OrderEngineError) {
      const statusMap: Record<string, number> = {
        INSUFFICIENT_BALANCE: 402,
        INVALID_QUANTITY: 400,
        INVALID_LINK: 400,
        SERVICE_UNAVAILABLE: 404,
        NO_PROVIDER: 409,
        PROVIDER_FAILED: 502,
      };
      return NextResponse.json({ error: err.message }, { status: statusMap[err.code] ?? 400 });
    }
    console.error("order.create failed", err);
    return NextResponse.json({ error: "Something went wrong placing your order." }, { status: 500 });
  }
}
