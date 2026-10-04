import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserOr401 } from "@/lib/api-auth";

const CUSTOM_PALETTE = [
  { color: "oklch(0.72 0.14 200)", soft: "oklch(0.72 0.14 200 / 0.15)" },
  { color: "oklch(0.72 0.13 250)", soft: "oklch(0.72 0.13 250 / 0.15)" },
  { color: "oklch(0.75 0.13 120)", soft: "oklch(0.75 0.13 120 / 0.15)" },
  { color: "oklch(0.7 0.16 40)", soft: "oklch(0.7 0.16 40 / 0.15)" },
];

export async function GET() {
  const { user, response } = await requireUserOr401();
  if (response) return response;

  const stages = await prisma.pipelineStage.findMany({
    where: { userId: user.id },
    orderBy: { position: "asc" },
  });
  return NextResponse.json({ stages });
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireUserOr401();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const label = String(body?.label ?? "").trim();
  const desc = String(body?.desc ?? "").trim() || null;
  const afterKey = String(body?.afterKey ?? "applied");
  if (!label) return NextResponse.json({ error: "Stage name is required." }, { status: 400 });

  const stages = await prisma.pipelineStage.findMany({ where: { userId: user.id }, orderBy: { position: "asc" } });
  const customCount = stages.filter((s) => s.custom).length;
  const palette = CUSTOM_PALETTE[customCount % CUSTOM_PALETTE.length];
  const afterIdx = Math.max(0, stages.findIndex((s) => s.key === afterKey));

  const key = "custom_" + Date.now();
  const newStage = {
    userId: user.id,
    key,
    label,
    desc,
    color: palette.color,
    soft: palette.soft,
    custom: true,
    position: afterIdx + 1,
  };

  // Shift positions of everything after the insertion point, then insert.
  await prisma.$transaction([
    ...stages
      .slice(afterIdx + 1)
      .map((s, i) => prisma.pipelineStage.update({ where: { id: s.id }, data: { position: afterIdx + 2 + i } })),
    prisma.pipelineStage.create({ data: newStage }),
  ]);

  const updated = await prisma.pipelineStage.findMany({ where: { userId: user.id }, orderBy: { position: "asc" } });
  return NextResponse.json({ stages: updated }, { status: 201 });
}
