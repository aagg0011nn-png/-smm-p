import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { generateApiKey } from "@/lib/crypto";

export async function GET() {
  const { session, error } = await requireUser();
  if (error) return NextResponse.json({ error }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: (session!.user as any).id },
    select: { apiKey: true },
  });
  return NextResponse.json({ apiKey: user?.apiKey ?? null });
}

// Generates a new API key, invalidating the previous one.
export async function POST() {
  const { session, error } = await requireUser();
  if (error) return NextResponse.json({ error }, { status: 401 });

  let apiKey = generateApiKey();
  // Extremely unlikely collision, but guard anyway since apiKey is unique.
  for (let attempts = 0; attempts < 5; attempts++) {
    const existing = await prisma.user.findUnique({ where: { apiKey } });
    if (!existing) break;
    apiKey = generateApiKey();
  }

  await prisma.user.update({ where: { id: (session!.user as any).id }, data: { apiKey } });
  return NextResponse.json({ apiKey });
}
