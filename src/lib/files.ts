// Server-side helpers for user-uploaded files (CVs, emails, home-assignment documents).
// Bytes live in the StoredFile table; every read goes through /api/files/[id], which checks ownership.
import { prisma } from "@/lib/db";

/** Stays under the ~4.5 MB serverless request-body cap, leaving room for multipart framing. */
export const MAX_FILE_BYTES = 4 * 1024 * 1024;

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  txt: "text/plain",
  eml: "message/rfc822",
  msg: "application/vnd.ms-outlook",
};

export function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

/**
 * The stored MIME type comes from the file extension, never from the client-supplied type —
 * so an upload can't claim to be something it isn't. Returns null for unsupported types
 * (notably html/svg/js, which could run script if ever served inline).
 */
export function mimeForName(name: string): string | null {
  return MIME_BY_EXT[extOf(name)] ?? null;
}

/** Types the browser can render safely in an iframe/img. Emails are served as plain text. */
export function inlineMime(mime: string): string | null {
  if (mime === "application/pdf" || mime.startsWith("image/") || mime === "text/plain") return mime;
  if (mime === "message/rfc822") return "text/plain; charset=utf-8";
  return null;
}

export const FILE_META_SELECT = { id: true, name: true, mime: true, size: true, createdAt: true } as const;

export type FileMeta = { id: string; name: string; mime: string; size: number; createdAt: string };

export function toFileMeta(f: { id: string; name: string; mime: string; size: number; createdAt: Date }): FileMeta {
  return { id: f.id, name: f.name, mime: f.mime, size: f.size, createdAt: f.createdAt.toISOString() };
}

/** Save an uploaded `File` for a user. Throws a user-facing Error on a bad type or size. */
export async function saveUpload(userId: string, file: File) {
  const mime = mimeForName(file.name);
  if (!mime) throw new Error("Unsupported file type. Use PDF, DOC/DOCX, an image, TXT, EML or MSG.");
  if (file.size === 0) throw new Error("That file is empty.");
  if (file.size > MAX_FILE_BYTES) throw new Error("File is too large — the limit is 4 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  return prisma.storedFile.create({
    data: { userId, name: file.name.slice(0, 200), mime, size: bytes.length, data: bytes },
    select: FILE_META_SELECT,
  });
}

/** Delete these files (owned by userId) unless something else still references them. */
export async function deleteOrphanFiles(userId: string, ids: (string | null | undefined)[]) {
  const unique = [...new Set(ids.filter((x): x is string => !!x))];
  for (const id of unique) {
    const [apps, lib, mails, assign] = await Promise.all([
      prisma.application.count({ where: { cvFileId: id } }),
      prisma.cvLibraryItem.count({ where: { fileId: id } }),
      prisma.stageEmail.count({ where: { fileId: id } }),
      prisma.assignmentFile.count({ where: { fileId: id } }),
    ]);
    if (apps + lib + mails + assign === 0) await prisma.storedFile.deleteMany({ where: { id, userId } });
  }
}
