import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, generateToken, hashToken } from "@/lib/auth";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();

  const ip = request.headers.get("x-forwarded-for") ?? "local";
  if (!checkRateLimit(`forgot:${ip}:${email}`)) {
    // Still return the generic success shape — don't leak rate-limit state to a prober.
    return NextResponse.json({ ok: true });
  }

  if (email) {
    const user = await prisma.user.findUnique({ where: { email } });
    // Only issue a reset token for password-based accounts that actually exist —
    // but always return the same response either way, to avoid leaking account existence.
    if (user && user.passwordHash) {
      const token = generateToken();
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });

      const resetUrl = `${request.nextUrl.origin}/reset-password?token=${token}`;
      // No email provider is wired up yet — log the link so it's usable in dev/demo.
      // Wire a real provider (Resend/Postmark/SES) here before shipping this to real users.
      console.log(`[password reset] ${email} -> ${resetUrl}`);
    }
  }

  return NextResponse.json({ ok: true });
}
