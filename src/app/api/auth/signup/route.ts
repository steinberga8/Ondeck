import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, hashPassword, syncAdminRole } from "@/lib/auth";
import { toSafeUser } from "@/lib/serialize";
import { seedDefaultStagesForUser } from "@/lib/stages";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const username = String(body.username ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const terms = !!body.terms;
  const keepLoggedIn = body.keepLoggedIn !== false;

  if (!username) return NextResponse.json({ error: "Username is required." }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  if (!terms) return NextResponse.json({ error: "You must accept the Terms & Conditions." }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists — try signing in instead." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  let user = await prisma.user.create({
    data: { username, email, passwordHash },
  });
  user = await syncAdminRole(user);
  await seedDefaultStagesForUser(user.id);

  await createSession(user.id, keepLoggedIn);

  return NextResponse.json({ user: toSafeUser(user) }, { status: 201 });
}
