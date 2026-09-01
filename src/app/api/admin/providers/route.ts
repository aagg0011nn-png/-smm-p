import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { providerCreateSchema } from "@/lib/validation";
import { encryptSecret } from "@/lib/crypto";
import { getAdapterForProvider } from "@/lib/providers/registry";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const providers = await prisma.provider.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      apiUrl: true,
      status: true,
      balance: true,
      lastSyncedAt: true,
      notes: true,
      createdAt: true,
      _count: { select: { services: true } },
      // apiKey intentionally excluded from responses
    },
  });

  return NextResponse.json({ providers });
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = providerCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const provider = await prisma.provider.create({
    data: {
      name: parsed.data.name,
      apiUrl: parsed.data.apiUrl,
      apiKey: encryptSecret(parsed.data.apiKey),
      notes: parsed.data.notes,
    },
  });

  // Verify the connection works before returning success, so the admin
  // finds out immediately if the URL/key is wrong rather than at order time.
  try {
    const adapter = getAdapterForProvider(provider);
    const balance = await adapter.getBalance();
    await prisma.provider.update({
      where: { id: provider.id },
      data: { balance, lastSyncedAt: new Date(), status: "ACTIVE" },
    });
  } catch (err) {
    await prisma.provider.update({ where: { id: provider.id }, data: { status: "ERROR" } });
    return NextResponse.json(
      { warning: "Provider saved, but the connection test failed. Check the URL/API key.", providerId: provider.id },
      { status: 201 }
    );
  }

  return NextResponse.json({ providerId: provider.id }, { status: 201 });
}
