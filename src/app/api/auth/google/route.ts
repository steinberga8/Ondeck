import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, syncAdminRole } from "@/lib/auth";
import { verifyGoogleIdToken } from "@/lib/google";
import { toSafeUser } from "@/lib/serialize";
import { seedDefaultStagesForUser } from "@/lib/stages";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const credential = String(body?.credential ?? "");
  const clientId = String(body?.clientId ?? "");
  const keepLoggedIn = body?.keepLoggedIn !== false;

  if (!credential || !clientId) {
    return NextResponse.json({ error: "Missing Google credential." }, { status: 400 });
  }

  let profile;
  try {
    profile = await verifyGoogleIdToken(credential, clientId);
  } catch {
    return NextResponse.json({ error: "Google sign-in failed — could not verify your account." }, { status: 401 });
  }

  // Account linking: a Google sign-in for an email that already has a
  // password-based account attaches the Google identity to that same row,
  // rather than silently creating a second account for the same person.
  let user = await prisma.user.findUnique({ where: { googleSub: profile.sub } });
  if (!user) {
    user = await prisma.user.findUnique({ where: { email: profile.email } });
    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleSub: profile.sub, picture: user.picture ?? profile.picture },
      });
    }
  }

  const isNew = !user;
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: profile.email,
        username: profile.name,
        googleSub: profile.sub,
        picture: profile.picture,
      },
    });
    await seedDefaultStagesForUser(user.id);
  }

  user = await syncAdminRole(user);
  await createSession(user.id, keepLoggedIn);

  return NextResponse.json({ user: toSafeUser(user), isNew });
}
