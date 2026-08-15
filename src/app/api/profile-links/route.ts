import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserOr401 } from "@/lib/api-auth";

function labelFor(url: string) {
  const u = url.toLowerCase();
  if (u.includes("linkedin")) return "LinkedIn";
  if (u.includes("github")) return "GitHub";
  if (u.includes("behance") || u.includes("dribbble")) return "Portfolio";
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "Website";
  }
}

export async function GET() {
  const { user, response } = await requireUserOr401();
  if (response) return response;
  const links = await prisma.profileLink.findMany({ where: { userId: user.id } });
  return NextResponse.json({ links });
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireUserOr401();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const raw = String(body?.url ?? "").trim();
  if (!raw) return NextResponse.json({ error: "URL is required." }, { status: 400 });
  const url = raw.startsWith("http") ? raw : `https://${raw}`;

  const link = await prisma.profileLink.create({
    data: { userId: user.id, label: labelFor(url), url },
  });
  return NextResponse.json({ link }, { status: 201 });
}
