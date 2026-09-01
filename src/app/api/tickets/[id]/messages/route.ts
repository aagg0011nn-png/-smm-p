import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const schema = z.object({ body: z.string().min(1).max(5000) });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireUser();
  if (error) return NextResponse.json({ error }, { status: 401 });

  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } });
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const userId = (session!.user as any).id as string;
  const role = (session!.user as any).role as string;
  const isStaff = ["ADMIN", "OWNER", "SUPPORT"].includes(role);
  const isOwner = ticket.userId === userId;
  if (!isOwner && !isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (ticket.status === "CLOSED") {
    return NextResponse.json({ error: "This ticket is closed." }, { status: 409 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });

  const message = await prisma.ticketMessage.create({
    data: { ticketId: ticket.id, userId, body: parsed.data.body, isStaff },
  });

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: isStaff ? "ANSWERED" : "OPEN", updatedAt: new Date() },
  });

  return NextResponse.json({ message }, { status: 201 });
}
