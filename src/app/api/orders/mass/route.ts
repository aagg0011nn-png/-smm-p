import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { placeOrder, OrderEngineError } from "@/lib/order-engine";
import { rateLimit } from "@/lib/rate-limit";

const lineSchema = z.object({
  serviceId: z.string().cuid(),
  link: z.string().url(),
  quantity: z.number().int().positive(),
});
const massOrderSchema = z.object({ lines: z.array(lineSchema).min(1).max(50) });

export async function POST(req: Request) {
  const { session, error } = await requireUser();
  if (error) return NextResponse.json({ error }, { status: 401 });

  const userId = (session!.user as any).id as string;
  const { allowed } = rateLimit(`mass-order:${userId}`, 5, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many mass-order submissions. Slow down." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = massOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  // Orders are placed sequentially (not Promise.all) so that balance checks
  // for each line see the correctly updated balance from the previous line.
  const results: Array<{ line: number; success: boolean; orderId?: string; error?: string }> = [];
  for (const [i, line] of parsed.data.lines.entries()) {
    try {
      const { order } = await placeOrder({ userId, ...line });
      results.push({ line: i + 1, success: true, orderId: order.id });
    } catch (err) {
      const message = err instanceof OrderEngineError ? err.message : "Unexpected error placing this order.";
      results.push({ line: i + 1, success: false, error: message });
    }
  }

  await prisma.activityLog.create({
    data: { userId, action: "order.mass_create", metadata: { count: parsed.data.lines.length, succeeded: results.filter((r) => r.success).length } },
  });

  return NextResponse.json({ results });
}
