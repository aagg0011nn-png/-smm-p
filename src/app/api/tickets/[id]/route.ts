import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireUser();
  if (error) return NextResponse.json({ error }, { status: 401 });

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: { messages: { orderBy: { createdAt: "asc" }, include: { user: { select: { name: true, role: true } } } } },
  });
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const isOwner = ticket.userId === (session!.user as any).id;
  const isAdmin = ["ADMIN", "OWNER", "SUPPORT"].includes((session!.user as any).role);
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({ ticket });
}

const patchSchema = z.object({ status: z.enum(["OPEN", "CLOSED"]) });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireUser();
  if (error) return NextResponse.json({ error }, { status: 401 });

  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } });
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const isOwner = ticket.userId === (session!.user as any).id;
  const isAdmin = ["ADMIN", "OWNER", "SUPPORT"].includes((session!.user as any).role);
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const updated = await prisma.ticket.update({ where: { id: ticket.id }, data: { status: parsed.data.status } });
  return NextResponse.json({ ticket: updated });
}
