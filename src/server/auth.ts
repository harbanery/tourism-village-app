import { randomBytes, timingSafeEqual, createHash } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import prisma from "@/server/db";
import { ADMIN_SESSION_COOKIE, SESSION_TTL_HOURS, USER_SESSION_COOKIE } from "@/config/variables";
import type { AuthAdmin, AuthUser } from "@prisma/client";

/**
 * Service autentikasi (admin + user web): password hashing (bcrypt),
 * manajemen sesi (12 jam), dan rate-limit login attempt per IP.
 * Pola dari admin-portfolio, diadaptasi untuk dua scope sesi.
 */

export const SESSION_TTL_MS = SESSION_TTL_HOURS * 60 * 60 * 1000;

export const MAX_LOGIN_ATTEMPTS = 5;

const LOGIN_BLOCK_MINUTES = 15;

const BCRYPT_ROUNDS = 12;

export type SessionScope = "admin" | "web";

// ---------------------------------------------------------------------------
// Password
// ---------------------------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Login attempt (rate-limit per IP + scope)
// ---------------------------------------------------------------------------

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export async function isIpBlocked(ipAddress: string): Promise<boolean> {
  const attempt = await prisma.loginAttempt.findUnique({
    where: { ipAddress },
  });
  if (!attempt?.blockedUntil) return false;
  return attempt.blockedUntil.getTime() > Date.now();
}

export async function recordFailedAttempt(
  ipAddress: string,
): Promise<{ blocked: boolean; blockedUntil: Date | null }> {
  const existing = await prisma.loginAttempt.findUnique({
    where: { ipAddress },
  });

  const attemptCount = (existing?.attemptCount ?? 0) + 1;
  const shouldBlock = attemptCount >= MAX_LOGIN_ATTEMPTS;
  const blockedUntil = shouldBlock
    ? new Date(Date.now() + LOGIN_BLOCK_MINUTES * 60 * 1000)
    : null;

  await prisma.loginAttempt.upsert({
    where: { ipAddress },
    update: {
      attemptCount: shouldBlock ? 0 : attemptCount,
      blockedUntil,
      lastAttemptAt: new Date(),
    },
    create: { ipAddress, attemptCount, blockedUntil },
  });

  return { blocked: shouldBlock, blockedUntil };
}

export async function clearFailedAttempts(ipAddress: string): Promise<void> {
  await prisma.loginAttempt.updateMany({
    where: { ipAddress },
    data: { attemptCount: 0, blockedUntil: null, lastAttemptAt: new Date() },
  });
}

// ---------------------------------------------------------------------------
// Session (token opaque, disimpan sebagai hash sha256 di DB)
// ---------------------------------------------------------------------------

function newSessionId(): string {
  return randomBytes(32).toString("base64url");
}

function hashSessionId(sessionId: string): string {
  return createHash("sha256").update(sessionId).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Buat sesi baru; mengembalikan token cookie + kedaluwarsa. */
export async function createSession(
  scope: SessionScope,
  userId: number,
): Promise<{ token: string; expiresAt: Date }> {
  const token = newSessionId();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  if (scope === "admin") {
    await prisma.adminSession.create({
      data: { id: hashSessionId(token), adminId: userId, expiresAt },
    });
    await prisma.adminSession.deleteMany({
      where: { adminId: userId, expiresAt: { lt: new Date() } },
    });
  } else {
    await prisma.userSession.create({
      data: { id: hashSessionId(token), userId, expiresAt },
    });
    await prisma.userSession.deleteMany({
      where: { userId, expiresAt: { lt: new Date() } },
    });
  }

  return { token, expiresAt };
}

/** Validasi token sesi. Mengembalikan id user/admin bila valid. */
export async function validateSession(
  scope: SessionScope,
  token: string | undefined | null,
): Promise<{ id: string; userId: number; expiresAt: Date } | null> {
  if (!token) return null;
  const hashed = hashSessionId(token);

  if (scope === "admin") {
    const session = await prisma.adminSession.findUnique({
      where: { id: hashed },
    });
    if (!session) return null;
    if (session.expiresAt.getTime() <= Date.now()) {
      await prisma.adminSession
        .delete({ where: { id: session.id } })
        .catch(() => {});
      return null;
    }
    return {
      id: session.id,
      userId: session.adminId,
      expiresAt: session.expiresAt,
    };
  }

  const session = await prisma.userSession.findUnique({
    where: { id: hashed },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.userSession
      .delete({ where: { id: session.id } })
      .catch(() => {});
    return null;
  }
  return { id: session.id, userId: session.userId, expiresAt: session.expiresAt };
}

export async function destroySession(
  scope: SessionScope,
  token: string | undefined | null,
): Promise<void> {
  if (!token) return;
  const hashed = hashSessionId(token);
  if (scope === "admin") {
    await prisma.adminSession
      .delete({ where: { id: hashed } })
      .catch(() => {});
  } else {
    await prisma.userSession
      .delete({ where: { id: hashed } })
      .catch(() => {});
  }
}

/** Opsi cookie sesi untuk `cookies().set()` di Route Handler. */
export function sessionCookieOptions(
  name: string,
  token: string,
  expiresAt: Date,
) {
  return {
    name,
    value: token,
    expires: expiresAt,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  };
}

// ---------------------------------------------------------------------------
// Guard sesi untuk Route Handler
// ---------------------------------------------------------------------------

/** Ambil admin yang sedang login (validasi penuh ke DB), null bila invalid. */
export async function getCurrentAdmin(): Promise<AuthAdmin | null> {
  const store = await cookies();
  const token = store.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await validateSession("admin", token);
  if (!session) return null;
  const admin = await prisma.authAdmin.findUnique({
    where: { id: session.userId },
  });
  if (!admin || admin.status !== "ACTIVE") return null;
  return admin;
}

/** Ambil user web yang sedang login, null bila invalid/nonaktif. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const token = store.get(USER_SESSION_COOKIE)?.value;
  const session = await validateSession("web", token);
  if (!session) return null;
  const user = await prisma.authUser.findUnique({
    where: { id: session.userId },
  });
  if (!user || user.status !== "ACTIVE") return null;
  return user;
}

/**
 * Guard API admin: valid + kembalikan admin, atau null (401 di route).
 * Role check dilakukan terpisah via `requireRole`.
 */
export async function requireAdmin(): Promise<AuthAdmin | null> {
  return getCurrentAdmin();
}

/** Cek apakah admin boleh mengakses resource berdasarkan role. */
export function adminCanWrite(admin: AuthAdmin): boolean {
  return admin.role === "MASTER";
}

/** Author boleh menulis blog; MASTER bisa semuanya. */
export function adminCanWriteBlog(admin: AuthAdmin): boolean {
  return admin.role === "MASTER" || admin.role === "AUTHOR";
}
