import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientKey } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const { allowed } = rateLimit(`forgot-password:${getClientKey(req)}`, 5, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond the same way whether or not the account exists,
  // to avoid leaking which emails are registered (user enumeration).
  const genericResponse = NextResponse.json({
    message: "If an account exists for this email, a reset link has been sent.",
  });

  if (!user) return genericResponse;

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordReset.create({
    data: { userId: user.id, token, expiresAt },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  // TODO: wire up a real email provider (Resend, SES, Postmark, etc.).
  // For now the link is logged server-side so you can test the flow.
  console.log(`[password-reset] ${email} -> ${resetUrl}`);

  return genericResponse;
}
