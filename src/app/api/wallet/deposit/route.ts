import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { depositSchema } from "@/lib/validation";

// Creates a pending manual payment. Nothing is credited to the user's
// balance until an admin approves it via /api/admin/payments/[id].
export async function POST(req: Request) {
  const { session, error } = await requireUser();
  if (error) return NextResponse.json({ error }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = depositSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const payment = await prisma.payment.create({
    data: {
      userId: (session!.user as any).id,
      amount: parsed.data.amount,
      method: parsed.data.method,
      referenceNote: parsed.data.referenceNote,
      proofUrl: parsed.data.proofUrl,
      status: "PENDING",
    },
  });

  return NextResponse.json({ payment }, { status: 201 });
}
