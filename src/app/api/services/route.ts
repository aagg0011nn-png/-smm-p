import { NextResponse } from "next/server";
import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function GET() {
  const { session } = await requireUser();

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { order: "asc" },
      },
    },
  });

  let multiplier: Decimal | null = null;
  if (session?.user) {
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { customRateMultiplier: true },
    });
    multiplier = user?.customRateMultiplier ? new Decimal(user.customRateMultiplier) : null;
  }

  const result = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    nameAr: cat.nameAr,
    services: cat.services.map((s) => ({
      id: s.id,
      name: s.name,
      nameAr: s.nameAr,
      description: s.description,
      min: s.min,
      max: s.max,
      rate: (multiplier ? new Decimal(s.rate).mul(multiplier) : new Decimal(s.rate)).toFixed(4),
      refillSupported: s.refillSupported,
      cancelSupported: s.cancelSupported,
      dripFeedSupported: s.dripFeedSupported,
    })),
  }));

  return NextResponse.json({ categories: result });
}
