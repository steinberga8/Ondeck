import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserOr401 } from "@/lib/api-auth";
import { deleteOrphanFiles, inlineMime } from "@/lib/files";

/**
 * Stream a file back to its owner. `?download=1` forces a download; otherwise PDFs, images and
 * text/emails are served inline for the preview modal. Everything else is always a download.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUserOr401();
  if (response) return response;
  const { id } = await params;

  const file = await prisma.storedFile.findUnique({ where: { id } });
  if (!file || file.userId !== user.id) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const wantsDownload = request.nextUrl.searchParams.get("download") === "1";
  const inline = wantsDownload ? null : inlineMime(file.mime);
  const asciiName = file.name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  const disposition = `${inline ? "inline" : "attachment"}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(file.name)}`;

  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": inline ?? "application/octet-stream",
      "Content-Length": String(file.size),
      "Content-Disposition": disposition,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUserOr401();
  if (response) return response;
  const { id } = await params;

  const file = await prisma.storedFile.findUnique({ where: { id }, select: { userId: true } });
  if (!file || file.userId !== user.id) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
  // Deleting a file that's still attached somewhere would silently break that reference, so
  // only remove it when nothing else points at it (callers detach first, then call this).
  await deleteOrphanFiles(user.id, [id]);
  return NextResponse.json({ ok: true });
}
