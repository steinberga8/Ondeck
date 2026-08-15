import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserOr401 } from "@/lib/api-auth";
import { toSafeUser } from "@/lib/serialize";

const EDITABLE_FIELDS = [
  "username",
  "title",
  "location",
  "experience",
  "goalApps",
  "goalMocks",
  "goalDate",
  "linkedinSynced",
  "mailSynced",
  "subscribed",
  "billingPlan",
] as const;

export async function PATCH(request: NextRequest) {
  const { user, response } = await requireUserOr401();
  if (response) return response;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const data: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) data[field] = body[field];
  }
  if (Array.isArray(body.fields)) data.fields = JSON.stringify(body.fields);

  const updated = await prisma.user.update({ where: { id: user.id }, data });
  return NextResponse.json({ user: toSafeUser(updated) });
}
