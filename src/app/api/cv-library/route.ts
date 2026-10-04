import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserOr401 } from "@/lib/api-auth";
import { FILE_META_SELECT, toFileMeta } from "@/lib/files";

function toApiLibraryItem(item: { id: string; name: string; date: string; tag: string; fileId: string | null; file: { id: string; name: string; mime: string; size: number; createdAt: Date } | null }) {
  return { id: item.id, name: item.name, date: item.date, tag: item.tag, fileId: item.fileId, file: item.file ? toFileMeta(item.file) : null };
}

export async function GET() {
  const { user, response } = await requireUserOr401();
  if (response) return response;
  const items = await prisma.cvLibraryItem.findMany({ where: { userId: user.id }, orderBy: { date: "desc" }, include: { file: { select: FILE_META_SELECT } } });
  return NextResponse.json({ items: items.map(toApiLibraryItem) });
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireUserOr401();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "File name is required." }, { status: 400 });

  // Optional: link the library entry to an uploaded file (must be this user's).
  let fileId: string | null = null;
  if (body?.fileId) {
    const file = await prisma.storedFile.findUnique({ where: { id: String(body.fileId) }, select: { userId: true } });
    if (!file || file.userId !== user.id) return NextResponse.json({ error: "File not found." }, { status: 400 });
    fileId = String(body.fileId);
  }

  const item = await prisma.cvLibraryItem.create({
    include: { file: { select: FILE_META_SELECT } },
    data: {
      userId: user.id,
      fileId,
      name,
      date: String(body?.date ?? new Date().toISOString().slice(0, 10)),
      tag: String(body?.tag ?? "v" + (Date.now() % 1000)),
    },
  });
  return NextResponse.json({ item: toApiLibraryItem(item) }, { status: 201 });
}
