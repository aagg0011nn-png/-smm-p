import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import { getAdapterForProvider } from "@/lib/providers/registry";
import { ProviderApiError } from "@/lib/providers/types";

export class OrderEngineError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
  }
}

/**
 * Calculates the charge for a given service + quantity, honoring any
 * per-user custom rate multiplier (custom pricing set by an admin).
 */
export function calculateCharge(rate: Decimal.Value, quantity: number, customMultiplier?: Decimal.Value | null) {
  const perThousand = new Decimal(rate).mul(customMultiplier ? new Decimal(customMultiplier) : 1);
  return perThousand.mul(quantity).div(1000).toDecimalPlaces(4);
}

/**
 * Places a new order end-to-end:
 *  1. Validate service + quantity bounds
 *  2. Compute charge (with custom user pricing if set)
 *  3. Atomically check balance and debit the user + create the order (DB transaction)
 *  4. Dispatch to the provider
 *  5. On provider failure, atomically refund and mark the order FAILED
 */
export async function placeOrder(params: { userId: string; serviceId: string; link: string; quantity: number }) {
  const { userId, serviceId, link, quantity } = params;

  const [user, service] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        providerServices: {
          where: { isActive: true },
          orderBy: { priority: "asc" },
          include: { provider: true },
        },
      },
    }),
  ]);

  if (!service || !service.isActive) {
    throw new OrderEngineError("Service not found or inactive.", "SERVICE_UNAVAILABLE");
  }
  if (quantity < service.min || quantity > service.max) {
    throw new OrderEngineError(`Quantity must be between ${service.min} and ${service.max}.`, "INVALID_QUANTITY");
  }
  if (service.providerServices.length === 0) {
    throw new OrderEngineError("No active provider is mapped to this service.", "NO_PROVIDER");
  }
  if (!/^https?:\/\//i.test(link)) {
    throw new OrderEngineError("Link must be a valid URL.", "INVALID_LINK");
  }

  const charge = calculateCharge(service.rate, quantity, user.customRateMultiplier);

  if (new Decimal(user.balance).lessThan(charge)) {
    throw new OrderEngineError("Insufficient balance.", "INSUFFICIENT_BALANCE");
  }

  // Step 1: reserve funds and create the order atomically, before calling
  // any external API. This guarantees we never charge without an order
  // record, and never create an order without charging.
  const { order, newBalance } = await prisma.$transaction(async (tx) => {
    const freshUser = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (new Decimal(freshUser.balance).lessThan(charge)) {
      throw new OrderEngineError("Insufficient balance.", "INSUFFICIENT_BALANCE");
    }
    const newBalance = new Decimal(freshUser.balance).minus(charge);

    const order = await tx.order.create({
      data: {
        userId,
        serviceId,
        link,
        quantity,
        charge,
        status: "PENDING",
      },
    });

    await tx.user.update({ where: { id: userId }, data: { balance: newBalance.toString() } });

    await tx.transaction.create({
      data: {
        userId,
        type: "ORDER_CHARGE",
        amount: charge.negated(),
        balanceAfter: newBalance,
        orderId: order.id,
        description: `Order charge for ${service.name}`,
      },
    });

    return { order, newBalance };
  });

  // Step 2: dispatch to the provider (first active mapping by priority).
  // Not inside the DB transaction: this is a network call and should not
  // hold a DB lock while awaiting an external, possibly slow, API.
  const mapping = service.providerServices[0];
  try {
    const adapter = getAdapterForProvider(mapping.provider);
    const result = await adapter.createOrder({
      externalServiceId: mapping.externalServiceId,
      link,
      quantity,
    });

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PROCESSING",
        providerServiceId: mapping.id,
        providerOrderId: result.providerOrderId,
        cost: calculateCharge(service.costRate, quantity),
      },
    });

    return { order: updated, balance: newBalance };
  } catch (err) {
    // Step 3: provider failed after we already charged -> refund atomically.
    await refundOrder(order.id, err instanceof ProviderApiError ? err.message : "Provider request failed.");
    throw new OrderEngineError("Provider rejected the order; you have been refunded.", "PROVIDER_FAILED");
  }
}

/**
 * Refunds a single order's charge back to the user's balance.
 * `finalStatus` lets callers control the resulting order status
 * (e.g. "FAILED" for provider errors, "CANCELED" for user cancellations).
 */
export async function refundOrder(orderId: string, reason: string, finalStatus: "FAILED" | "CANCELED" | "REFUNDED" = "FAILED") {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    if (order.status === "REFUNDED") return order; // idempotent

    const user = await tx.user.findUniqueOrThrow({ where: { id: order.userId } });
    const newBalance = new Decimal(user.balance).plus(order.charge);

    await tx.user.update({ where: { id: user.id }, data: { balance: newBalance.toString() } });
    await tx.transaction.create({
      data: {
        userId: user.id,
        type: "REFUND",
        amount: order.charge,
        balanceAfter: newBalance,
        description: `Refund for order ${order.id}: ${reason}`,
      },
    });

    return tx.order.update({
      where: { id: orderId },
      data: { status: finalStatus, failureReason: reason, canceledAt: finalStatus === "CANCELED" ? new Date() : order.canceledAt },
    });
  });
}

/** Polls the provider for the current status of one order and syncs local state. */
export async function syncOrderStatus(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { service: { include: { providerServices: { include: { provider: true } } } } },
  });

  if (!order.providerOrderId || !order.providerServiceId) return order;

  const mapping = order.service.providerServices.find((ps) => ps.id === order.providerServiceId);
  if (!mapping) return order;

  const adapter = getAdapterForProvider(mapping.provider);
  const statusResult = await adapter.getOrderStatus(order.providerOrderId);

  const statusMap: Record<string, typeof order.status> = {
    Pending: "PENDING",
    "In progress": "IN_PROGRESS",
    Processing: "PROCESSING",
    Completed: "COMPLETED",
    Partial: "PARTIAL",
    Canceled: "CANCELED",
    Failed: "FAILED",
  };
  const mappedStatus = statusMap[statusResult.status] ?? order.status;

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: mappedStatus,
      startCount: statusResult.startCount ?? order.startCount,
      remains: statusResult.remains ?? order.remains,
    },
  });

  // Auto-refund logic for partial/canceled orders (refund unfulfilled portion).
  if ((mappedStatus === "PARTIAL" || mappedStatus === "CANCELED") && statusResult.remains && order.status !== mappedStatus) {
    const unfulfilledRatio = new Decimal(statusResult.remains).div(order.quantity);
    const refundAmount = new Decimal(order.charge).mul(unfulfilledRatio).toDecimalPlaces(4);
    if (refundAmount.greaterThan(0)) {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUniqueOrThrow({ where: { id: order.userId } });
        const newBalance = new Decimal(user.balance).plus(refundAmount);
        await tx.user.update({ where: { id: user.id }, data: { balance: newBalance.toString() } });
        await tx.transaction.create({
          data: {
            userId: user.id,
            type: "REFUND",
            amount: refundAmount,
            balanceAfter: newBalance,
            description: `Partial refund for order ${order.id} (${statusResult.remains} unfulfilled)`,
          },
        });
      });
    }
  }

  return updated;
}
