import { NextResponse } from "next/server";
import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import { placeOrder, OrderEngineError } from "@/lib/order-engine";
import { rateLimit } from "@/lib/rate-limit";

// This endpoint mirrors the same "action=..." convention this panel itself
// uses to talk to upstream providers (see src/lib/providers/generic-smm-adapter.ts).
// That means anyone building their own reseller tool against THIS panel can
// reuse existing SMM-API client libraries unmodified.
//
// Auth: POST form-urlencoded body must include `key` = the user's personal API key
// (generated at /api-access, stored as User.apiKey).

async function authenticate(form: URLSearchParams) {
  const key = form.get("key");
  if (!key) return null;
  return prisma.user.findUnique({ where: { apiKey: key } });
}

function errorResponse(message: string) {
  return NextResponse.json({ error: message });
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  const raw = contentType.includes("application/json") ? new URLSearchParams(await req.json()) : new URLSearchParams(await req.text());

  const user = await authenticate(raw);
  if (!user) return errorResponse("Invalid API key");
  if (user.status !== "ACTIVE") return errorResponse("Account is not active");

  const { allowed } = rateLimit(`api-v2:${user.id}`, 60, 60_000); // 60 req/min per user
  if (!allowed) return errorResponse("Rate limit exceeded");

  const action = raw.get("action");

  switch (action) {
    case "services": {
      const services = await prisma.service.findMany({
        where: { isActive: true },
        include: { category: true },
      });
      const multiplier = user.customRateMultiplier ? new Decimal(user.customRateMultiplier) : null;
      return NextResponse.json(
        services.map((s) => ({
          service: s.id,
          name: s.name,
          category: s.category.name,
          rate: (multiplier ? new Decimal(s.rate).mul(multiplier) : new Decimal(s.rate)).toFixed(4),
          min: s.min,
          max: s.max,
          refill: s.refillSupported,
          cancel: s.cancelSupported,
        }))
      );
    }

    case "add": {
      const serviceId = raw.get("service");
      const link = raw.get("link");
      const quantity = Number(raw.get("quantity"));
      if (!serviceId || !link || !quantity) return errorResponse("service, link and quantity are required");

      try {
        const { order } = await placeOrder({ userId: user.id, serviceId, link, quantity });
        return NextResponse.json({ order: order.id });
      } catch (err) {
        return errorResponse(err instanceof OrderEngineError ? err.message : "Could not place order");
      }
    }

    case "status": {
      const orderId = raw.get("order");
      if (!orderId) return errorResponse("order is required");
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order || order.userId !== user.id) return errorResponse("Order not found");
      return NextResponse.json({
        charge: order.charge.toString(),
        start_count: order.startCount ?? 0,
        status: order.status,
        remains: order.remains ?? 0,
      });
    }

    case "balance": {
      return NextResponse.json({ balance: user.balance.toString(), currency: "USD" });
    }

    default:
      return errorResponse("Unknown action. Supported: services, add, status, balance");
  }
}
