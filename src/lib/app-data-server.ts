// Server-only data fetch for the Kanban/Table/Detail/Analytics pages. Mirrors the
// GET handlers in src/app/api/{applications,stages}/route.ts so the initial page
// render is server-rendered with real data instead of an empty client-fetch flash;
// all subsequent mutations still go through those same API routes from the client.
import { prisma } from "@/lib/db";
import { toApiApplication } from "@/lib/serialize";
import type { Application, PipelineStage } from "./app-types";

export async function getUserAppsAndStages(userId: string): Promise<{ apps: Application[]; stages: PipelineStage[] }> {
  const [apps, stages] = await Promise.all([
    prisma.application.findMany({ where: { userId }, orderBy: { appliedDate: "desc" } }),
    prisma.pipelineStage.findMany({ where: { userId }, orderBy: { position: "asc" } }),
  ]);
  return { apps: apps.map(toApiApplication), stages };
}
