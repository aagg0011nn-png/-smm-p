import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { ticketCreateSchema } from "@/lib/validation";

export async function GET() {
  const { session, error } = await requireUser();
  if (error) return NextResponse.json({ error }, { status: 401 });

  const tickets = await prisma.ticket.findMany({
    where: { userId: (session!.user as any).id },
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 1 } },
  });

  return NextResponse.json({ tickets });
}

export async function POST(req: Request) {
  const { session, error } = await requireUser();
  if (error) return NextResponse.json({ error }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = ticketCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const userId = (session!.user as any).id as string;

  const ticket = await prisma.ticket.create({
    data: {
      userId,
      subject: parsed.data.subject,
      messages: { create: { userId, body: parsed.data.message, isStaff: false } },
    },
    include: { messages: true },
  });

  return NextResponse.json({ ticket }, { status: 201 });
}
