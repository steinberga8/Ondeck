import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function requireUserOr401() {
  const user = await getSessionUser();
  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Not authenticated." }, { status: 401 }) };
  }
  return { user, response: null };
}
