import { NextRequest, NextResponse } from "next/server";
import prisma from "@/server/db";
import { sendEmail, isEmailConfigured } from "@/server/email";
import { createOtp, OTP_PURPOSES, type OtpPurpose } from "@/server/otp";
import { buildOtpEmail } from "@/server/otpEmail";
import { NODE_ENV } from "@/config/variables";

/**
 * POST /api/web/auth/resend-otp — kirim ulang kode OTP.
 * Body: { userId, purpose }. Dijaga cooldown 60 detik oleh service OTP.
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

    // Reset password hanya boleh dikirim ulang dari halaman lupa password.
    if (purpose === "RESET_PASSWORD") {
      return NextResponse.json(
        { success: false, error: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const otp = await createOtp(user.id, purpose as OtpPurpose);
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
