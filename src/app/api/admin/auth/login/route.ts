import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/server/db";
import { ADMIN_SESSION_COOKIE } from "@/config/variables";
import {
  clearFailedAttempts,
  createSession,
  getClientIp,
  isIpBlocked,
  MAX_LOGIN_ATTEMPTS,
  recordFailedAttempt,
  sessionCookieOptions,
  verifyPassword,
} from "@/server/auth";

function toRemainingMinutes(blockedUntil: Date | null | undefined): number {
  if (!blockedUntil) return 15;
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

    if (await isIpBlocked(ip)) {
      const attempt = await prisma.loginAttempt.findUnique({
        where: { ipAddress: ip },
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
      const { blocked, blockedUntil } = await recordFailedAttempt(ip);
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
        where: { ipAddress: ip },
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

    await clearFailedAttempts(ip);
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
