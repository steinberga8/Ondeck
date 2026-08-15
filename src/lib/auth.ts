import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import type { User } from "@/generated/prisma/client";

const SESSION_COOKIE = "ondeck_session";
const KEEP_LOGGED_IN_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const DEFAULT_SESSION_MAX_AGE = 60 * 60 * 24; // 1 day safety-net expiry

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string, keepLoggedIn: boolean) {
  const maxAgeSeconds = keepLoggedIn ? KEEP_LOGGED_IN_MAX_AGE : DEFAULT_SESSION_MAX_AGE;
  const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000);

  const session = await prisma.session.create({
    data: { userId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Omitting maxAge for "not kept logged in" makes it a true browser-session cookie,
    // while the DB-side expiresAt still caps how long the session id is honored server-side.
    ...(keepLoggedIn ? { maxAge: maxAgeSeconds } : {}),
  });

  return session;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session.user;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new AuthError("Not authenticated");
  return user;
}

export class AuthError extends Error {}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

// In-memory rate limiter — fine for a single-process app; swap for a shared
// store (Redis, etc.) if this ever runs across multiple instances.
const attempts = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

// Manager/admin access is a server-controlled role, never a client-supplied
// credential (the mock's client-side MANAGER_CREDS password was the #1 flagged
// security hole in the handoff). Promotion is driven by an ADMIN_EMAILS env var
// set at deploy time — no signup field, no client toggle.
export async function syncAdminRole(user: User): Promise<User> {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (user.role !== "admin" && adminEmails.includes(user.email.toLowerCase())) {
    return prisma.user.update({ where: { id: user.id }, data: { role: "admin" } });
  }
  return user;
}

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const existing = (attempts.get(key) ?? []).filter((t) => t > windowStart);
  if (existing.length >= RATE_LIMIT_MAX) {
    attempts.set(key, existing);
    return false;
  }
  existing.push(now);
  attempts.set(key, existing);
  return true;
}
