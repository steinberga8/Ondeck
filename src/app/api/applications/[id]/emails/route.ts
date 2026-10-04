import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { findOwnedApplication, requireUserOr401 } from "@/lib/api-auth";
import { extOf, saveUpload } from "@/lib/files";
import { APP_INCLUDE, toApiApplication } from "@/lib/serialize";

const TEXT_EMAIL_EXTS = new Set(["eml", "txt"]);

/** Pull "Subject:" / "From:" headers out of raw email text; the design does the same on attach/paste. */
function parseEmailHeaders(text: string) {
  const subject = (text.match(/^Subject:\s*(.+)$/im)?.[1] ?? "").trim().slice(0, 80);
  const sender = (text.match(/^From:\s*(.+)$/im)?.[1] ?? "").trim().slice(0, 60);
  return { subject: subject || null, sender: sender || null };
}

/**
 * Attach an email to one stage of an application's history. Two shapes:
 *  - multipart: `file` (.eml/.msg/.pdf/image/…) + `stage`
 *  - JSON: `{ stage, text }` for pasted email text
 * Responds with the refreshed application.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUserOr401();
  if (response) return response;
  const { id } = await params;
  if (!(await findOwnedApplication(user.id, id))) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const isMultipart = (request.headers.get("content-type") ?? "").includes("multipart/form-data");

  if (isMultipart) {
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    const stageKey = String(form?.get("stage") ?? "").trim();
    if (!(file instanceof File) || !stageKey) {
      return NextResponse.json({ error: "A file and a stage are required." }, { status: 400 });
    }
    let saved;
    try {
      saved = await saveUpload(user.id, file);
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed." }, { status: 400 });
    }
    const headers = TEXT_EMAIL_EXTS.has(extOf(file.name)) ? parseEmailHeaders((await file.text()).slice(0, 150_000)) : { subject: null, sender: null };
    await prisma.stageEmail.create({
      data: { applicationId: id, stageKey, fileId: saved.id, name: saved.name, subject: headers.subject, sender: headers.sender },
    });
  } else {
    const body = await request.json().catch(() => null);
    const text = String(body?.text ?? "").trim();
    const stageKey = String(body?.stage ?? "").trim();
    if (!text || !stageKey) return NextResponse.json({ error: "Email text and a stage are required." }, { status: 400 });
    const headers = parseEmailHeaders(text);
    const subject = headers.subject ?? text.split("\n")[0].trim().slice(0, 70);
    await prisma.stageEmail.create({
      data: { applicationId: id, stageKey, name: subject || "Email", subject: subject || null, sender: headers.sender, body: text.slice(0, 150_000) },
    });
  }

  const updated = await prisma.application.findUniqueOrThrow({ where: { id }, include: APP_INCLUDE });
  return NextResponse.json({ application: toApiApplication(updated) }, { status: 201 });
}
