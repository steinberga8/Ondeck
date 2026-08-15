import type { Application, User } from "@/generated/prisma/client";

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

export function toApiApplication(app: Application) {
  return {
    ...app,
    jdKeywords: JSON.parse(app.jdKeywords) as string[],
    notes: JSON.parse(app.notes) as { date: string; text: string }[],
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  };
}

export type ApiApplication = ReturnType<typeof toApiApplication>;
