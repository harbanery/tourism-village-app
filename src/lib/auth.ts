import { randomBytes, timingSafeEqual, createHash } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import {
  ADMIN_SESSION_COOKIE,
  NODE_ENV,
  SESSION_TTL_HOURS,
  USER_SESSION_COOKIE,
} from "@/utils/config/variables";
import type { AuthAdmin, AuthUser } from "@prisma/client";

/**
 * Service autentikasi (admin + user web): password hashing (bcrypt),
 * manajemen sesi (12 jam), dan rate-limit login attempt per IP.
 * Pola dari admin-portfolio, diadaptasi untuk dua scope sesi.
 */

export const SESSION_TTL_MS = SESSION_TTL_HOURS * 60 * 60 * 1000;

/**
 * Batas sesi aktif per user/admin (rekomendasi 2.1): sesi ke-6 memangkas
 * sesi tertua — mencegah penumpukan sesi tak terbatas (login berulang).
 */
export const MAX_SESSIONS_PER_USER = 5;

/**
 * Rate limit: 3 percobaan gagal → blokir 15 menit (per IP per scope).
 * Scope terpisah agar blokir login admin tidak memengaruhi login/register web.
 * Counter hanya diakumulasi dalam window 15 menit — kegagalan lama tidak
 * membuat user mendadak terblokir ("BLOCKED padahal belum gagal 3x").
 */
export const MAX_LOGIN_ATTEMPTS = 3;

export const LOGIN_BLOCK_MINUTES = 15;

/** Jendela akumulasi kegagalan (samakan dengan durasi blokir). */
export const LOGIN_ATTEMPT_WINDOW_MS = LOGIN_BLOCK_MINUTES * 60 * 1000;

export const RATE_LIMIT_SCOPES = {
  adminLogin: "admin-login",
  webLogin: "web-login",
  webRegister: "web-register",
} as const;

export type RateLimitScope =
  (typeof RATE_LIMIT_SCOPES)[keyof typeof RATE_LIMIT_SCOPES];

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
// Rate limit per IP per scope (login admin/web + register web)
// ---------------------------------------------------------------------------

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

/**
 * Cek same-origin untuk mutasi (CSRF-lite, rekomendasi 2.4): browser
 * modern selalu menyertakan Origin pada cross-site POST — bila Origin
 * ada namun host-nya berbeda dengan Host header, tolak. Permintaan tanpa
 * Origin (non-browser / server-to-server) dibiarkan lewat; autentikasi
 * tetap memagari akses.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Kunci komposit (ipAddress, scope) model LoginAttempt. */
function attemptKey(ipAddress: string, scope: RateLimitScope) {
  return { ipAddress_scope: { ipAddress, scope } };
}

export async function isIpBlocked(
  ipAddress: string,
  scope: RateLimitScope,
): Promise<boolean> {
  const attempt = await prisma.loginAttempt.findUnique({
    where: attemptKey(ipAddress, scope),
  });
  if (!attempt?.blockedUntil) return false;
  return attempt.blockedUntil.getTime() > Date.now();
}

export async function recordFailedAttempt(
  ipAddress: string,
  scope: RateLimitScope,
): Promise<{
  blocked: boolean;
  blockedUntil: Date | null;
  attemptCount: number;
}> {
  const existing = await prisma.loginAttempt.findUnique({
    where: attemptKey(ipAddress, scope),
  });

  // Kegagalan di luar window dianggap perhitungan baru (tidak menumpuk
  // dengan kegagalan lama) — mencegah blokir mendadak dari akumulasi
  // percobaan yang berjarak berjam-jam/hari.
  const isStale =
    !!existing &&
    Date.now() - existing.lastAttemptAt.getTime() > LOGIN_ATTEMPT_WINDOW_MS;

  const attemptCount = isStale ? 1 : (existing?.attemptCount ?? 0) + 1;
  const shouldBlock = attemptCount >= MAX_LOGIN_ATTEMPTS;
  const blockedUntil = shouldBlock
    ? new Date(Date.now() + LOGIN_BLOCK_MINUTES * 60 * 1000)
    : null;

  await prisma.loginAttempt.upsert({
    where: attemptKey(ipAddress, scope),
    update: {
      attemptCount: shouldBlock ? 0 : attemptCount,
      blockedUntil,
      lastAttemptAt: new Date(),
    },
    create: { ipAddress, scope, attemptCount, blockedUntil },
  });

  return { blocked: shouldBlock, blockedUntil, attemptCount };
}

export async function clearFailedAttempts(
  ipAddress: string,
  scope: RateLimitScope,
): Promise<void> {
  // updateMany (bukan update): tidak melempar P2025 saat belum ada row
  // untuk IP+scope ini — bersih kalau ada, no-op kalau tidak. Where-nya
  // filter datar (bukan composite unique key).
  await prisma.loginAttempt.updateMany({
    where: { ipAddress, scope },
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
  userId: string,
): Promise<{ token: string; expiresAt: Date }> {
  const token = newSessionId();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  if (scope === "admin") {
    await prisma.adminSession.create({
      data: { id: hashSessionId(token), adminId: userId, expiresAt },
    });
    // Bersihkan sesi kedaluwarsa, lalu pangkas sesi melebihi kuota
    // (terlama dihapus lebih dulu — rekomendasi 2.1).
    await prisma.adminSession.deleteMany({
      where: { adminId: userId, expiresAt: { lt: new Date() } },
    });
    const sessions = await prisma.adminSession.findMany({
      where: { adminId: userId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    const excess = sessions.slice(MAX_SESSIONS_PER_USER).map((s) => s.id);
    if (excess.length > 0) {
      await prisma.adminSession.deleteMany({ where: { id: { in: excess } } });
    }
  } else {
    await prisma.userSession.create({
      data: { id: hashSessionId(token), userId, expiresAt },
    });
    await prisma.userSession.deleteMany({
      where: { userId, expiresAt: { lt: new Date() } },
    });
    const sessions = await prisma.userSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    const excess = sessions.slice(MAX_SESSIONS_PER_USER).map((s) => s.id);
    if (excess.length > 0) {
      await prisma.userSession.deleteMany({ where: { id: { in: excess } } });
    }
  }

  return { token, expiresAt };
}

/** Validasi token sesi. Mengembalikan id user/admin bila valid. */
export async function validateSession(
  scope: SessionScope,
  token: string | undefined | null,
): Promise<{ id: string; userId: string; expiresAt: Date } | null> {
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
  return {
    id: session.id,
    userId: session.userId,
    expiresAt: session.expiresAt,
  };
}

export async function destroySession(
  scope: SessionScope,
  token: string | undefined | null,
): Promise<void> {
  if (!token) return;
  const hashed = hashSessionId(token);
  if (scope === "admin") {
    await prisma.adminSession.delete({ where: { id: hashed } }).catch(() => {});
  } else {
    await prisma.userSession.delete({ where: { id: hashed } }).catch(() => {});
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
    secure: NODE_ENV === "production",
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
