import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";
import { rateLimit, getClientKey } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const key = `register:${getClientKey(req)}`;
  const { allowed } = rateLimit(key, 5, 60_000); // 5 attempts / minute / IP
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Same message regardless of which field collided, to avoid user enumeration nuance
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name.trim(),
      email,
      passwordHash,
      role: "USER",
    },
    select: { id: true, email: true, name: true },
  });

  await prisma.activityLog.create({
    data: { userId: user.id, action: "auth.register", ip: getClientKey(req) },
  });

  return NextResponse.json({ user }, { status: 201 });
}
