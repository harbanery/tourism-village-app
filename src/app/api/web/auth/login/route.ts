import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/server/db";
import {
  RATE_LIMIT_SCOPES,
  clearFailedAttempts,
  createSession,
  getClientIp,
  isIpBlocked,
  MAX_LOGIN_ATTEMPTS,
  recordFailedAttempt,
  sessionCookieOptions,
  verifyPassword,
} from "@/server/auth";
import { USER_SESSION_COOKIE } from "@/config/variables";

function toRemainingMinutes(blockedUntil: Date | null | undefined): number {
  if (!blockedUntil) return 24 * 60;
  return Math.max(
    1,
    Math.ceil((blockedUntil.getTime() - Date.now()) / (60 * 1000)),
  );
}

/** POST /api/web/auth/login — login user web dengan email + password. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body as Record<string, unknown>;

    if (
      typeof email !== "string" ||
      email.length === 0 ||
      typeof password !== "string" ||
      password.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const ip = getClientIp(request);
    const scope = RATE_LIMIT_SCOPES.webLogin;

    if (await isIpBlocked(ip, scope)) {
      const attempt = await prisma.loginAttempt.findUnique({
        where: { ipAddress_scope: { ipAddress: ip, scope } },
      });
      return NextResponse.json(
        {
          success: false,
          error: "BLOCKED",
          minutes: toRemainingMinutes(attempt?.blockedUntil),
        },
        { status: 429 },
      );
    }

    const user = await prisma.authUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    const ok = user
      ? user.status === "ACTIVE" &&
        (await verifyPassword(password, user.password))
      : false;

    if (!ok || !user) {
      const { blocked, blockedUntil } = await recordFailedAttempt(ip, scope);
      if (blocked) {
        return NextResponse.json(
          {
            success: false,
            error: "BLOCKED",
            minutes: toRemainingMinutes(blockedUntil),
          },
          { status: 429 },
        );
      }
      const attempt = await prisma.loginAttempt.findUnique({
        where: { ipAddress_scope: { ipAddress: ip, scope } },
      });
      const remaining = Math.max(
        0,
        MAX_LOGIN_ATTEMPTS - (attempt?.attemptCount ?? 1),
      );
      return NextResponse.json(
        { success: false, error: "INVALID", remaining },
        { status: 401 },
      );
    }

    // Email belum diverifikasi via OTP → arahkan ke halaman OTP dulu.
    if (!user.emailVerified) {
      return NextResponse.json(
        { success: false, error: "EMAIL_NOT_VERIFIED", userId: user.id },
        { status: 403 },
      );
    }

    await clearFailedAttempts(ip, scope);
    const { token, expiresAt } = await createSession("web", user.id);
    const store = await cookies();
    store.set(sessionCookieOptions(USER_SESSION_COOKIE, token, expiresAt));

    return NextResponse.json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Error user login:", error);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
