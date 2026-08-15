import { prisma } from "@/lib/db";

export const DEFAULT_STAGES = [
  { key: "applied", label: "Applied", color: "var(--st-applied)", soft: "var(--st-applied-soft)" },
  { key: "screening", label: "Screening Call", color: "var(--st-screening)", soft: "var(--st-screening-soft)" },
  { key: "interview1", label: "1st Interview", color: "var(--st-int1)", soft: "var(--st-int1-soft)" },
  { key: "assignment", label: "Home Assignment", color: "var(--st-assign)", soft: "var(--st-assign-soft)" },
  { key: "hr", label: "HR Interview", color: "var(--st-hr)", soft: "var(--st-hr-soft)" },
  { key: "contract", label: "Contract / Offer", color: "var(--st-contract)", soft: "var(--st-contract-soft)" },
];

export async function seedDefaultStagesForUser(userId: string) {
  await prisma.pipelineStage.createMany({
    data: DEFAULT_STAGES.map((s, i) => ({ ...s, userId, position: i, custom: false })),
  });
}
