import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

const createServiceSchema = z.object({
  categoryId: z.string().cuid(),
  name: z.string().min(2).max(200),
  nameAr: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  min: z.number().int().positive(),
  max: z.number().int().positive(),
  rate: z.number().positive(), // price to customer per 1000
  providerId: z.string().cuid(),
  externalServiceId: z.string().min(1),
  costRate: z.number().positive(), // provider's price per 1000
  refillSupported: z.boolean().default(false),
  cancelSupported: z.boolean().default(false),
});

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const services = await prisma.service.findMany({
    include: {
      category: { select: { name: true } },
      providerServices: { include: { provider: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ services });
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createServiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  if (parsed.data.rate <= parsed.data.costRate) {
    return NextResponse.json(
      { error: "Customer rate must be higher than provider cost rate (no margin otherwise)." },
      { status: 400 }
    );
  }

  const service = await prisma.$transaction(async (tx) => {
    const created = await tx.service.create({
      data: {
        categoryId: parsed.data.categoryId,
        name: parsed.data.name,
        nameAr: parsed.data.nameAr,
        description: parsed.data.description,
        min: parsed.data.min,
        max: parsed.data.max,
        rate: parsed.data.rate,
        costRate: parsed.data.costRate,
        refillSupported: parsed.data.refillSupported,
        cancelSupported: parsed.data.cancelSupported,
      },
    });

    await tx.providerService.create({
      data: {
        providerId: parsed.data.providerId,
        serviceId: created.id,
        externalServiceId: parsed.data.externalServiceId,
        priority: 0,
      },
    });

    return created;
  });

  return NextResponse.json({ service }, { status: 201 });
}
