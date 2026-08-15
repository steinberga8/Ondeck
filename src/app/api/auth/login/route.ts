import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, createSession, syncAdminRole, verifyPassword } from "@/lib/auth";
import { toSafeUser } from "@/lib/serialize";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const keepLoggedIn = body.keepLoggedIn !== false;

  if (!email || !password) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "local";
  if (!checkRateLimit(`login:${ip}:${email}`)) {
    return NextResponse.json({ error: "Too many attempts — try again in a few minutes." }, { status: 429 });
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "No account found with that email." }, { status: 401 });
  }
  if (!user.passwordHash) {
    return NextResponse.json({ error: "This account uses Google sign-in — continue with Google instead." }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  user = await syncAdminRole(user);
  await createSession(user.id, keepLoggedIn);

  return NextResponse.json({ user: toSafeUser(user) });
}
