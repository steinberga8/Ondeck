import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, generateToken, hashToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

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
      try {
        await sendPasswordResetEmail(email, resetUrl);
      } catch (err) {
        // Don't fail the request or leak delivery failures to the client —
        // this is still the generic "if an account exists..." response either way.
        console.error("Failed to send password reset email:", err);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
