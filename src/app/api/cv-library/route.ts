import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserOr401 } from "@/lib/api-auth";

export async function GET() {
  const { user, response } = await requireUserOr401();
  if (response) return response;
  const items = await prisma.cvLibraryItem.findMany({ where: { userId: user.id }, orderBy: { date: "desc" } });
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireUserOr401();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "File name is required." }, { status: 400 });

  const item = await prisma.cvLibraryItem.create({
    data: {
      userId: user.id,
      name,
      date: String(body?.date ?? new Date().toISOString().slice(0, 10)),
      tag: String(body?.tag ?? "v" + (Date.now() % 1000)),
    },
  });
  return NextResponse.json({ item }, { status: 201 });
}
