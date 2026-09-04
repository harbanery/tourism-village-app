import { NextRequest, NextResponse } from "next/server";
import prisma from "@/server/db";
import { sendEmail, isEmailConfigured } from "@/server/email";
import { createOtp, OTP_PURPOSES, type OtpPurpose } from "@/server/otp";
import { buildOtpEmail } from "@/server/otpEmail";
import { NODE_ENV } from "@/config/variables";

/**
 * POST /api/web/auth/resend-otp — kirim ulang kode OTP.
 * Body: { userId, purpose }. Dijaga cooldown 5 menit antar kirim; setelah
 * 5 kali kirim ulang dalam 15 menit → rate limit (tunggu sisa jendela).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, purpose } = body as Record<string, unknown>;

    const parsedUserId = Number(userId);
    if (
      !Number.isInteger(parsedUserId) ||
      typeof purpose !== "string" ||
      !OTP_PURPOSES.includes(purpose as OtpPurpose)
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

    // Email ganti (EMAIL_CHANGE) dikelola lewat pengaturan profil, bukan di sini.
    if (purpose === "EMAIL_CHANGE") {
      return NextResponse.json(
        { success: false, error: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const otp = await createOtp(user.id, purpose as OtpPurpose);
    if ("rateLimitSeconds" in otp) {
      return NextResponse.json(
        {
          success: false,
          error: "RATE_LIMITED",
          seconds: otp.rateLimitSeconds,
        },
        { status: 429 },
      );
    }
    if ("cooldownSeconds" in otp) {
      return NextResponse.json(
        { success: false, error: "COOLDOWN", seconds: otp.cooldownSeconds },
        { status: 429 },
      );
    }

    void sendEmail({
      to: user.email,
      ...buildOtpEmail({
        name: user.name,
        code: otp.code,
        purpose: purpose as OtpPurpose,
      }),
    });

    let devCode: string | undefined;
    if (!isEmailConfigured() && NODE_ENV !== "production") {
      devCode = otp.code;
    }

    return NextResponse.json({
      success: true,
      ...(devCode ? { data: { devCode } } : {}),
      resendsLeft: otp.resendsLeft,
    });
  } catch (error) {
    console.error("Error resend otp:", error);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
