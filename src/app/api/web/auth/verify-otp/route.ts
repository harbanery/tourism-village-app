import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/server/db";
import { createSession, sessionCookieOptions } from "@/server/auth";
import { USER_SESSION_COOKIE } from "@/config/variables";
import { verifyOtp } from "@/server/otp";

/**
 * POST /api/web/auth/verify-otp — verifikasi kode OTP registrasi.
 *
 * - REGISTER_VERIFICATION: tandai email terverifikasi lalu auto-login
 *   (sesi baru dibuat di sini).
 * - RESET_PASSWORD diverifikasi terpisah di route reset-password.
 * - EMAIL_CHANGE diverifikasi terpisah di /api/web/profile/email/verify
 *   (berbasis sesi login).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, code } = body as Record<string, unknown>;

    const parsedUserId = Number(userId);
    if (
      !Number.isInteger(parsedUserId) ||
      typeof code !== "string" ||
      !/^\d{6}$/.test(code)
    ) {
      return NextResponse.json(
        { success: false, error: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const user = await prisma.authUser.findUnique({
      where: { id: parsedUserId },
    });
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "INVALID_OTP" },
        { status: 400 },
      );
    }

    const result = await verifyOtp(user.id, "REGISTER_VERIFICATION", code);
    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          error: result.reason,
          ...(result.remainingAttempts !== undefined
            ? { remainingAttempts: result.remainingAttempts }
            : {}),
        },
        { status: 400 },
      );
    }

    if (!user.emailVerified) {
      await prisma.authUser.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    }

    // Auto-login setelah verifikasi register (belum punya sesi sebelumnya).
    const { token, expiresAt } = await createSession("web", user.id);
    const store = await cookies();
    store.set(sessionCookieOptions(USER_SESSION_COOKIE, token, expiresAt));

    return NextResponse.json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Error verify otp:", error);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
