import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(128).regex(/[A-Z]/).regex(/[0-9]/),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input. Password needs 8+ chars, an uppercase letter, and a number." }, { status: 400 });
  }

  const reset = await prisma.passwordReset.findUnique({ where: { token: parsed.data.token } });
  if (!reset || reset.expiresAt < new Date()) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
    // Invalidate this token and any other outstanding reset tokens for the user
    prisma.passwordReset.deleteMany({ where: { userId: reset.userId } }),
  ]);

  return NextResponse.json({ message: "Password updated. You can now log in." });
}
