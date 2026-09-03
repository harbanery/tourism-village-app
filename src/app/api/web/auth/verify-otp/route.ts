import { NextRequest, NextResponse } from "next/server";
import prisma from "@/server/db";
import { verifyOtp } from "@/server/otp";

/**
 * POST /api/web/auth/verify-otp — verifikasi kode OTP di halaman /otp.
 *
 * Purpose (dipilih klien):
 * - REGISTER_VERIFICATION: tandai email terverifikasi → user lanjut ke
 *   /login sendiri (flow: registrasi → otp → login, TANPA auto-login).
 * - RESET_PASSWORD: cukup memverifikasi kepemilikan akun — kode TIDAK
 *   dikonsumsi (peek) karena diverifikasi ulang + dikonsumsi final oleh
 *   route reset-password saat password baru disimpan.
 * - EMAIL_CHANGE diverifikasi terpisah di /api/web/profile/email/verify
 *   (berbasis sesi login).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, code, purpose } = body as Record<string, unknown>;

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

    const otpPurpose =
      purpose === "RESET_PASSWORD" ? "RESET_PASSWORD" : "REGISTER_VERIFICATION";

    const user = await prisma.authUser.findUnique({
      where: { id: parsedUserId },
    });
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "INVALID_OTP" },
        { status: 400 },
      );
    }

    // Reset password peek saja (konsumsi final di reset-password).
    const result = await verifyOtp(user.id, otpPurpose, code, {
      consume: otpPurpose !== "RESET_PASSWORD",
    });
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

    if (otpPurpose === "RESET_PASSWORD") {
      // OTP reset valid → lanjut ke halaman reset password (tanpa sesi).
      return NextResponse.json({
        success: true,
        data: { next: "reset-password" },
      });
    }

    if (!user.emailVerified) {
      await prisma.authUser.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    }

    // Registrasi selesai → user login sendiri di /login (tanpa auto-login).
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
