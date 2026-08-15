import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserOr401 } from "@/lib/api-auth";
import { toApiApplication } from "@/lib/serialize";

function linkSource(link: string | null) {
  if (!link) return null;
  const l = link.toLowerCase();
  if (l.includes("linkedin")) return "LinkedIn";
  if (l.includes("glassdoor")) return "Glassdoor";
  return "Company site";
}

function deriveKeywords(desc: string) {
  const words = (desc || "").split(/[^A-Za-z+#.]+/).filter((w) => w.length > 4);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    const cap = w[0].toUpperCase() + w.slice(1);
    if (!seen.has(cap)) {
      seen.add(cap);
      out.push(cap);
    }
    if (out.length >= 4) break;
  }
  return out.length ? out : ["Communication", "Ownership", "Problem Solving"];
}

export async function GET() {
  const { user, response } = await requireUserOr401();
  if (response) return response;

  const apps = await prisma.application.findMany({
    where: { userId: user.id },
    orderBy: { appliedDate: "desc" },
  });
  return NextResponse.json({ applications: apps.map(toApiApplication) });
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireUserOr401();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const company = String(body?.company ?? "").trim();
  const role = String(body?.title ?? body?.role ?? "").trim();
  if (!company || !role) {
    return NextResponse.json({ error: "Company and title are required." }, { status: 400 });
  }

  const link = String(body?.link ?? "").trim() || null;
  const desc = String(body?.desc ?? "").trim() || null;
  const referral = !!body?.referral;
  const appliedDate = String(body?.date ?? "").trim() || new Date().toISOString().slice(0, 10);
  const cvName = body?.cvName ? String(body.cvName) : null;

  const app = await prisma.application.create({
    data: {
      userId: user.id,
      company,
      role,
      source: referral ? "Referral" : linkSource(link) ?? "Direct",
      cvVersion: cvName,
      link,
      appliedDate,
      stage: "applied",
      nextStep: "Awaiting response",
      desc,
      referral,
      jdKeywords: JSON.stringify(deriveKeywords(desc ?? "")),
      notes: JSON.stringify([{ date: appliedDate.slice(5), text: "Added manually via New Application." }]),
    },
  });

  return NextResponse.json({ application: toApiApplication(app) }, { status: 201 });
}
