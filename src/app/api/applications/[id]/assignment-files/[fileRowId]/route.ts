import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { findOwnedApplication, requireUserOr401 } from "@/lib/api-auth";
import { deleteOrphanFiles } from "@/lib/files";
import { APP_INCLUDE, toApiApplication } from "@/lib/serialize";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string; fileRowId: string }> }) {
  const { user, response } = await requireUserOr401();
  if (response) return response;
  const { id, fileRowId } = await params;
  if (!(await findOwnedApplication(user.id, id))) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const row = await prisma.assignmentFile.findUnique({ where: { id: fileRowId } });
  if (!row || row.applicationId !== id) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
  await prisma.assignmentFile.delete({ where: { id: fileRowId } });
  await deleteOrphanFiles(user.id, [row.fileId]);

  const updated = await prisma.application.findUniqueOrThrow({ where: { id }, include: APP_INCLUDE });
  return NextResponse.json({ application: toApiApplication(updated) });
}
