import { NextResponse } from "next/server";
import { z } from "zod";
import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

const updateSchema = z.object({
  role: z.enum(["USER", "SUPPORT", "ADMIN", "OWNER"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]).optional(),
  customRateMultiplier: z.number().positive().max(10).nullable().optional(),
  balanceAdjustment: z.number().optional(), // positive to add, negative to subtract; logged as ADJUSTMENT
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  // Only OWNER can promote/demote to ADMIN or OWNER, to prevent privilege escalation by a lower admin.
  const actorRole = (session!.user as any).role;
  if (parsed.data.role && ["ADMIN", "OWNER"].includes(parsed.data.role) && actorRole !== "OWNER") {
    return NextResponse.json({ error: "Only an owner can grant admin privileges." }, { status: 403 });
  }

  const { balanceAdjustment, ...directFields } = parsed.data;

  const user = await prisma.$transaction(async (tx) => {
    let updated = await tx.user.update({ where: { id: params.id }, data: directFields });

    if (balanceAdjustment) {
      const newBalance = new Decimal(updated.balance).plus(balanceAdjustment);
      if (newBalance.isNegative()) {
        throw new Error("BALANCE_WOULD_BE_NEGATIVE");
      }
      updated = await tx.user.update({ where: { id: params.id }, data: { balance: newBalance.toString() } });
      await tx.transaction.create({
        data: {
          userId: params.id,
          type: "ADJUSTMENT",
          amount: balanceAdjustment,
          balanceAfter: newBalance,
          description: `Manual adjustment by ${(session!.user as any).id}`,
        },
      });
    }

    return updated;
  }).catch((err) => {
    if (err.message === "BALANCE_WOULD_BE_NEGATIVE") return null;
    throw err;
  });

  if (!user) {
    return NextResponse.json({ error: "Adjustment would make balance negative." }, { status: 400 });
  }

  await prisma.activityLog.create({
    data: {
      userId: (session!.user as any).id,
      action: "admin.user.update",
      metadata: { targetUserId: params.id, changes: parsed.data },
    },
  });

  return NextResponse.json({ user: { ...user, apiKey: undefined } });
}
