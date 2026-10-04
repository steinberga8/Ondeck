import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function requireUserOr401() {
  const user = await getSessionUser();
  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Not authenticated." }, { status: 401 }) };
  }
  return { user, response: null };
}

/** Load an application only if it belongs to `userId` (null otherwise — callers respond 404). */
export async function findOwnedApplication(userId: string, id: string) {
  const app = await prisma.application.findUnique({ where: { id } });
  return app && app.userId === userId ? app : null;
}
