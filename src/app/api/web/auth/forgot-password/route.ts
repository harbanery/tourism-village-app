import { NextRequest, NextResponse } from "next/server";
import prisma from "@/server/db";
import { sendEmail, isEmailConfigured } from "@/server/email";
import { createOtp } from "@/server/otp";
import { buildOtpEmail } from "@/server/otpEmail";
import { NODE_ENV } from "@/config/variables";

/**
 * POST /api/web/auth/forgot-password — minta OTP reset password.
 * Selalu merespons sukses (tidak membocokan keberadaan akun); OTP hanya
 * dikirim bila email terdaftar.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body as Record<string, unknown>;
    if (typeof email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const user = await prisma.authUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    let devCode: string | undefined;
    if (user && user.status === "ACTIVE") {
      const otp = await createOtp(user.id, "RESET_PASSWORD");
      if ("code" in otp) {
        void sendEmail({
          to: user.email,
          ...buildOtpEmail({ name: user.name, code: otp.code, purpose: "RESET_PASSWORD" }),
        });
        if (!isEmailConfigured() && NODE_ENV !== "production") {
          devCode = otp.code;
        }
      }
    }

    return NextResponse.json({
      success: true,
      ...(devCode ? { data: { devCode } } : {}),
    });
  } catch (error) {
    console.error("Error forgot password:", error);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
