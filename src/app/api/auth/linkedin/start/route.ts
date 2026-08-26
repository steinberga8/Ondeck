import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateToken } from "@/lib/auth";
import { buildLinkedInAuthUrl } from "@/lib/linkedin";

const STATE_COOKIE = "linkedin_oauth_state";

export async function GET(request: NextRequest) {
  const keepLoggedIn = request.nextUrl.searchParams.get("keep") !== "0";
  const state = generateToken();
  const redirectUri = `${request.nextUrl.origin}/api/auth/linkedin/callback`;

  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, `${state}:${keepLoggedIn ? "1" : "0"}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes — just long enough to complete the redirect round trip
  });

  let authUrl: string;
  try {
    authUrl = buildLinkedInAuthUrl(redirectUri, state);
  } catch {
    return NextResponse.redirect(new URL("/?error=linkedin_not_configured", request.nextUrl.origin));
  }

  return NextResponse.redirect(authUrl);
}
