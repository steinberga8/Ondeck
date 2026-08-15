import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { toSafeUser } from "@/lib/serialize";

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user: user ? toSafeUser(user) : null });
}
