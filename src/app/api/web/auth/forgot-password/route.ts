import { NextRequest, NextResponse } from "next/server";
import prisma from "@/server/db";
import { sendEmail, isEmailConfigured } from "@/server/email";
import { createOtp } from "@/server/otp";
import { buildOtpEmail } from "@/server/otpEmail";
import { NODE_ENV } from "@/config/variables";

/**
 * POST /api/web/auth/forgot-password — minta OTP reset password.
 * Email divalidasi: bila tidak terdaftar → gagal dengan EMAIL_NOT_FOUND.
 * (Permintaan: validasi email, jika tidak ada di DB maka gagal.)
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

    // Email tidak terdaftar / akun nonaktif → gagal (permintaan eksplisit).
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "EMAIL_NOT_FOUND" },
        { status: 404 },
      );
    }

    const otp = await createOtp(user.id, "RESET_PASSWORD");
    let devCode: string | undefined;
    if ("code" in otp) {
      void sendEmail({
        to: user.email,
        ...buildOtpEmail({ name: user.name, code: otp.code, purpose: "RESET_PASSWORD" }),
      });
      if (!isEmailConfigured() && NODE_ENV !== "production") {
        devCode = otp.code;
      }
    } else if ("rateLimitSeconds" in otp) {
      // Terlalu banyak kirim ulang → tunggu sisa jendela rate limit.
      // userId tetap disertakan agar klien bisa melanjutkan ke halaman OTP
      // (kode terakhir masih berlaku sampai kedaluwarsa).
      return NextResponse.json(
        {
          success: false,
          error: "RATE_LIMITED",
          seconds: otp.rateLimitSeconds,
          data: { userId: user.id },
        },
        { status: 429 },
      );
    } else {
      // Cooldown resend — tetap lanjut ke halaman OTP dengan kode lama
      // (userId disertakan agar klien bisa melanjutkan alur).
      return NextResponse.json(
        {
          success: false,
          error: "COOLDOWN",
          seconds: otp.cooldownSeconds,
          data: { userId: user.id },
        },
        { status: 429 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { userId: user.id, email: user.email, ...(devCode ? { devCode } : {}) },
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
