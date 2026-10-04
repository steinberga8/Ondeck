import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { findOwnedApplication, requireUserOr401 } from "@/lib/api-auth";
import { saveUpload } from "@/lib/files";
import { APP_INCLUDE, toApiApplication } from "@/lib/serialize";

/** Upload a Home Assignment document: multipart `file` + `slot` ("brief" or "submission"). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUserOr401();
  if (response) return response;
  const { id } = await params;
  if (!(await findOwnedApplication(user.id, id))) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const slot = String(form?.get("slot") ?? "");
  if (!(file instanceof File) || (slot !== "brief" && slot !== "submission")) {
    return NextResponse.json({ error: "A file and a slot (brief or submission) are required." }, { status: 400 });
  }

  let saved;
  try {
    saved = await saveUpload(user.id, file);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed." }, { status: 400 });
  }
  await prisma.assignmentFile.create({ data: { applicationId: id, slot, fileId: saved.id } });

  const updated = await prisma.application.findUniqueOrThrow({ where: { id }, include: APP_INCLUDE });
  return NextResponse.json({ application: toApiApplication(updated) }, { status: 201 });
}
