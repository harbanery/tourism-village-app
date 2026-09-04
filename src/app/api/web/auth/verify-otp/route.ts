import { NextRequest, NextResponse } from "next/server";
import prisma from "@/server/db";
import { verifyOtp, createResetToken } from "@/server/otp";

/**
 * POST /api/web/auth/verify-otp — verifikasi kode OTP di halaman /otp.
 *
 * Purpose (dipilih klien):
 * - REGISTER_VERIFICATION: tandai email terverifikasi → user lanjut ke
 *   /login sendiri (flow: registrasi → otp → login, TANPA auto-login).
 * - RESET_PASSWORD: bukti kepemilikan akun — kode dikonsumsi final di sini
 *   lalu diterbitkan token reset sekali pakai (halaman /reset-password
 *   menerima token, bukan userId, agar identitas tidak bocor di URL).
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

    const result = await verifyOtp(user.id, otpPurpose, code);
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
      // OTP reset valid & dikonsumsi → terbitkan token reset sekali pakai
      // (privasi: halaman reset tidak lagi menerima userId di URL).
      const token = await createResetToken(user.id);
      return NextResponse.json({
        success: true,
        data: { next: "reset-password", token },
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
