import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { findOwnedApplication, requireUserOr401 } from "@/lib/api-auth";
import { deleteOrphanFiles } from "@/lib/files";
import { APP_INCLUDE, toApiApplication } from "@/lib/serialize";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string; emailId: string }> }) {
  const { user, response } = await requireUserOr401();
  if (response) return response;
  const { id, emailId } = await params;
  if (!(await findOwnedApplication(user.id, id))) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const email = await prisma.stageEmail.findUnique({ where: { id: emailId } });
  if (!email || email.applicationId !== id) {
    return NextResponse.json({ error: "Email not found." }, { status: 404 });
  }
  await prisma.stageEmail.delete({ where: { id: emailId } });
  await deleteOrphanFiles(user.id, [email.fileId]);

  const updated = await prisma.application.findUniqueOrThrow({ where: { id }, include: APP_INCLUDE });
  return NextResponse.json({ application: toApiApplication(updated) });
}
