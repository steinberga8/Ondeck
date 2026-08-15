import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserOr401 } from "@/lib/api-auth";
import { toApiApplication } from "@/lib/serialize";

const EDITABLE_FIELDS = [
  "company",
  "role",
  "source",
  "cvVersion",
  "cvFileName",
  "link",
  "appliedDate",
  "stage",
  "nextStep",
  "desc",
  "referral",
  "rejected",
  "rejectedAt",
  "assignmentTitle",
  "assignmentDesc",
  "assignmentDue",
] as const;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUserOr401();
  if (response) return response;
  const { id } = await params;

  const existing = await prisma.application.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const data: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) data[field] = body[field];
  }
  if (Array.isArray(body.jdKeywords)) data.jdKeywords = JSON.stringify(body.jdKeywords);
  if (Array.isArray(body.notes)) data.notes = JSON.stringify(body.notes);
  if (body.appendNote && typeof body.appendNote.text === "string") {
    const notes = JSON.parse(existing.notes) as { date: string; text: string }[];
    notes.push({ date: body.appendNote.date ?? new Date().toISOString().slice(5, 10), text: body.appendNote.text });
    data.notes = JSON.stringify(notes);
  }
  // Toggling rejected off clears which stage it was rejected at.
  if (data.rejected === false && !("rejectedAt" in data)) data.rejectedAt = null;

  const updated = await prisma.application.update({ where: { id }, data });
  return NextResponse.json({ application: toApiApplication(updated) });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUserOr401();
  if (response) return response;
  const { id } = await params;

  const existing = await prisma.application.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  await prisma.application.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
