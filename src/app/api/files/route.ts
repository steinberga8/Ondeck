import { NextRequest, NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/api-auth";
import { saveUpload, toFileMeta } from "@/lib/files";

/** Upload one file (multipart field "file"). Returns its metadata; attach it via the other endpoints. */
export async function POST(request: NextRequest) {
  const { user, response } = await requireUserOr401();
  if (response) return response;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }

  try {
    const saved = await saveUpload(user.id, file);
    return NextResponse.json({ file: toFileMeta(saved) }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed." }, { status: 400 });
  }
}
