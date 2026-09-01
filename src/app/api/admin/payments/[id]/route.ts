import { NextResponse } from "next/server";
import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { paymentReviewSchema } from "@/lib/validation";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = paymentReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({ where: { id: params.id } });
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (payment.status !== "PENDING") {
    return NextResponse.json({ error: "Payment has already been reviewed." }, { status: 409 });
  }

  const adminId = (session!.user as any).id as string;

  if (parsed.data.action === "REJECT") {
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "REJECTED",
        rejectionReason: parsed.data.rejectionReason ?? "Rejected by admin",
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });
    return NextResponse.json({ payment: updated });
  }

  // APPROVE: credit balance and record the payment + transaction atomically.
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: payment.userId } });
    const newBalance = new Decimal(user.balance).plus(payment.amount);

    await tx.user.update({ where: { id: user.id }, data: { balance: newBalance.toString() } });

    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: { status: "APPROVED", reviewedById: adminId, reviewedAt: new Date() },
    });

    await tx.transaction.create({
      data: {
        userId: user.id,
        type: "DEPOSIT",
        amount: payment.amount,
        balanceAfter: newBalance,
        paymentId: payment.id,
        description: `Deposit approved (${payment.method})`,
      },
    });

    return updatedPayment;
  });

  return NextResponse.json({ payment: result });
}
