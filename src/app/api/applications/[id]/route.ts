import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserOr401 } from "@/lib/api-auth";
import { APP_INCLUDE, toApiApplication } from "@/lib/serialize";
import { deleteOrphanFiles } from "@/lib/files";

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
    const notes = JSON.parse(existing.notes) as { date: string; text: string; stage?: string }[];
    notes.push({
      date: body.appendNote.date ?? new Date().toISOString().slice(5, 10),
      text: body.appendNote.text,
      ...(typeof body.appendNote.stage === "string" ? { stage: body.appendNote.stage } : {}),
    });
    data.notes = JSON.stringify(notes);
  }
  if (Number.isInteger(body.removeNoteIndex)) {
    const notes = JSON.parse((data.notes as string | undefined) ?? existing.notes) as unknown[];
    notes.splice(body.removeNoteIndex, 1);
    data.notes = JSON.stringify(notes);
  }

  // Swap the CV file: it must be one of this user's files (or null to detach).
  let replacedCvFileId: string | null = null;
  if ("cvFileId" in body) {
    if (body.cvFileId === null) {
      data.cvFileId = null;
      data.cvFileName = null;
    } else {
      const file = await prisma.storedFile.findUnique({ where: { id: String(body.cvFileId) }, select: { userId: true, name: true } });
      if (!file || file.userId !== user.id) return NextResponse.json({ error: "CV file not found." }, { status: 400 });
      data.cvFileId = String(body.cvFileId);
      data.cvFileName = file.name;
      // Attaching a file to an application with no CV label yet makes it a tailored CV.
      if (!existing.cvVersion || existing.cvVersion === "—") data.cvVersion = "CV Tailored";
    }
    if (existing.cvFileId && existing.cvFileId !== data.cvFileId) replacedCvFileId = existing.cvFileId;
  }
  // Toggling rejected off clears which stage it was rejected at.
  if (data.rejected === false && !("rejectedAt" in data)) data.rejectedAt = null;

  const updated = await prisma.application.update({ where: { id }, data, include: APP_INCLUDE });
  if (replacedCvFileId) await deleteOrphanFiles(user.id, [replacedCvFileId]);
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

  // Gather this application's files first; the rows cascade away with it, the bytes need explicit cleanup.
  const [emails, assignment] = await Promise.all([
    prisma.stageEmail.findMany({ where: { applicationId: id }, select: { fileId: true } }),
    prisma.assignmentFile.findMany({ where: { applicationId: id }, select: { fileId: true } }),
  ]);
  await prisma.application.delete({ where: { id } });
  await deleteOrphanFiles(user.id, [existing.cvFileId, ...emails.map((e) => e.fileId), ...assignment.map((a) => a.fileId)]);
  return NextResponse.json({ ok: true });
}
