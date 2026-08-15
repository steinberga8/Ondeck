import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserOr401 } from "@/lib/api-auth";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUserOr401();
  if (response) return response;
  const { id } = await params;

  const existing = await prisma.profileLink.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Link not found." }, { status: 404 });
  }
  await prisma.profileLink.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
