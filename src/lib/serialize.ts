import type { Prisma, User } from "@/generated/prisma/client";
import { FILE_META_SELECT, toFileMeta } from "@/lib/files";

export function toSafeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    picture: user.picture,
    fields: JSON.parse(user.fields) as string[],
    experience: user.experience,
    title: user.title,
    location: user.location,
    linkedinSynced: user.linkedinSynced,
    mailSynced: user.mailSynced,
    goalApps: user.goalApps,
    goalMocks: user.goalMocks,
    goalDate: user.goalDate,
    trialStartedAt: user.trialStartedAt.toISOString(),
    subscribed: user.subscribed,
    billingPlan: user.billingPlan,
    createdAt: user.createdAt.toISOString(),
    hasPassword: !!user.passwordHash,
  };
}

export type SafeUser = ReturnType<typeof toSafeUser>;

/** Relations every API/server read of an application loads, so the payload always carries file info. */
export const APP_INCLUDE = {
  cvFile: { select: FILE_META_SELECT },
  emails: { orderBy: { createdAt: "asc" }, include: { file: { select: FILE_META_SELECT } } },
  assignmentFiles: { orderBy: { createdAt: "asc" }, include: { file: { select: FILE_META_SELECT } } },
} satisfies Prisma.ApplicationInclude;

type AppWithRelations = Prisma.ApplicationGetPayload<{ include: typeof APP_INCLUDE }>;

export function toApiApplication(app: AppWithRelations) {
  const { cvFile, emails, assignmentFiles, ...rest } = app;
  return {
    ...rest,
    jdKeywords: JSON.parse(app.jdKeywords) as string[],
    notes: JSON.parse(app.notes) as { date: string; text: string; stage?: string }[],
    cvFile: cvFile ? toFileMeta(cvFile) : null,
    emails: emails.map((m) => ({
      id: m.id,
      stageKey: m.stageKey,
      name: m.name,
      subject: m.subject,
      sender: m.sender,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      file: m.file ? toFileMeta(m.file) : null,
    })),
    assignmentFiles: assignmentFiles.map((f) => ({ id: f.id, slot: f.slot as "brief" | "submission", createdAt: f.createdAt.toISOString(), file: toFileMeta(f.file) })),
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  };
}

export type ApiApplication = ReturnType<typeof toApiApplication>;
