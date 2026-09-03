import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/server/db";
import { ADMIN_SESSION_COOKIE } from "@/config/variables";
import {
  RATE_LIMIT_SCOPES,
  clearFailedAttempts,
  createSession,
  getClientIp,
  isIpBlocked,
  LOGIN_BLOCK_MINUTES,
  MAX_LOGIN_ATTEMPTS,
  recordFailedAttempt,
  sessionCookieOptions,
  verifyPassword,
} from "@/server/auth";

function toRemainingMinutes(blockedUntil: Date | null | undefined): number {
  if (!blockedUntil) return LOGIN_BLOCK_MINUTES;
  return Math.max(
    1,
    Math.ceil((blockedUntil.getTime() - Date.now()) / (60 * 1000)),
  );
}

/**
 * POST /api/admin/auth/login
 * Login admin dengan username + password. Rate-limit per IP, sesi 12 jam.
 */
export async function POST(request: NextRequest) {
  try {
    let username: unknown;
    let password: unknown;
    try {
      const body = await request.json();
      username = body?.username;
      password = body?.password;
    } catch {
      return NextResponse.json(
        { success: false, error: "INVALID_BODY" },
        { status: 400 },
      );
    }

    if (
      typeof username !== "string" ||
      username.length === 0 ||
      typeof password !== "string" ||
      password.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const ip = getClientIp(request);
    const scope = RATE_LIMIT_SCOPES.adminLogin;

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

    const admin = await prisma.authAdmin.findUnique({
      where: { username },
    });

    const ok = admin
      ? admin.status === "ACTIVE" && (await verifyPassword(password, admin.password))
      : false;

    if (!ok || !admin) {
      const { blocked, blockedUntil, attemptCount } = await recordFailedAttempt(
        ip,
        scope,
      );
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
      const remaining = Math.max(0, MAX_LOGIN_ATTEMPTS - attemptCount);
      return NextResponse.json(
        { success: false, error: "INVALID", remaining },
        { status: 401 },
      );
    }

    await clearFailedAttempts(ip, scope);
    const { token, expiresAt } = await createSession("admin", admin.id);
    const store = await cookies();
    store.set(
      sessionCookieOptions(ADMIN_SESSION_COOKIE, token, expiresAt),
    );

    return NextResponse.json({
      success: true,
      data: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error admin login:", error);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
