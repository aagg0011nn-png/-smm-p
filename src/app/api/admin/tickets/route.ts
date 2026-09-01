import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";

export async function GET(req: Request) {
  const { error } = await requireStaff();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const tickets = await prisma.ticket.findMany({
    where: status ? { status: status as any } : undefined,
    orderBy: { updatedAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
    take: 100,
  });

  return NextResponse.json({ tickets });
}
