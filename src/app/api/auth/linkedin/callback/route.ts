import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { createSession, syncAdminRole } from "@/lib/auth";
import { exchangeLinkedInCode, fetchLinkedInProfile } from "@/lib/linkedin";
import { seedDefaultStagesForUser } from "@/lib/stages";

const STATE_COOKIE = "linkedin_oauth_state";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");

  const cookieStore = await cookies();
  const stored = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  const fail = (reason: string) => NextResponse.redirect(new URL(`/?error=${reason}`, origin));

  if (oauthError) return fail("linkedin_denied");
  if (!code || !state || !stored) return fail("linkedin_invalid_state");

  const [storedState, keepFlag] = stored.split(":");
  if (storedState !== state) return fail("linkedin_invalid_state");
  const keepLoggedIn = keepFlag === "1";

  try {
    const redirectUri = `${origin}/api/auth/linkedin/callback`;
    const accessToken = await exchangeLinkedInCode(code, redirectUri);
    const profile = await fetchLinkedInProfile(accessToken);

    // Account linking: a LinkedIn sign-in for an email that already has an
    // account attaches the LinkedIn identity to that same row, same pattern
    // used for Google sign-in.
    let user = await prisma.user.findUnique({ where: { linkedinId: profile.sub } });
    if (!user) {
      user = await prisma.user.findUnique({ where: { email: profile.email } });
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { linkedinId: profile.sub, picture: user.picture ?? profile.picture },
        });
      }
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: profile.email,
          username: profile.name,
          linkedinId: profile.sub,
          picture: profile.picture,
        },
      });
      await seedDefaultStagesForUser(user.id);
    }

    user = await syncAdminRole(user);
    await createSession(user.id, keepLoggedIn);

    return NextResponse.redirect(new URL("/app", origin));
  } catch (err) {
    console.error("LinkedIn sign-in failed:", err);
    return fail("linkedin_failed");
  }
}
