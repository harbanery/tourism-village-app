import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyPassword } from "@/lib/auth";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { createOtp } from "@/lib/otp";
import { buildOtpEmail } from "@/utils/email/otpEmail";
import { NODE_ENV } from "@/utils/config/variables";

/** Aturan password baru (sama seperti reset password). */
function isNewPasswordValid(password: string): boolean {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

/**
 * POST /api/web/profile/password — minta ganti password (wajib login).
 * Wajib menyertakan password lama (keamanan: memastikan pemilik akun),
 * lalu OTP dikirim ke email aktif user. Password baru diterapkan hanya
 * setelah OTP diverifikasi di /password/verify — pada saat itu semua
 * sesi login dicabut.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body as Record<string, unknown>;

    // Verifikasi password lama: hanya pemilik akun yang boleh mengajukan.
    if (typeof currentPassword !== "string" || !currentPassword) {
      return NextResponse.json(
        { success: false, error: "PASSWORD_REQUIRED" },
        { status: 400 },
      );
    }
    const passwordValid = await verifyPassword(currentPassword, user.password);
    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: "INVALID_PASSWORD" },
        { status: 403 },
      );
    }

    if (typeof newPassword !== "string" || !isNewPasswordValid(newPassword)) {
      return NextResponse.json(
        { success: false, error: "NEW_PASSWORD_INVALID" },
        { status: 400 },
      );
    }

    // Password baru harus berbeda dengan password aktif.
    const sameAsOld = await verifyPassword(newPassword, user.password);
    if (sameAsOld) {
      return NextResponse.json(
        { success: false, error: "NEW_PASSWORD_SAME" },
        { status: 400 },
      );
    }

    const otp = await createOtp(user.id, "PASSWORD_CHANGE");
    let devCode: string | undefined;
    if ("code" in otp) {
      // OTP dikirim ke email AKTIF (bukan email baru — memastikan pemilik
      // akun yang menerima kode).
      void sendEmail({
        to: user.email,
        ...buildOtpEmail({
          name: user.name,
          code: otp.code,
          purpose: "PASSWORD_CHANGE",
        }),
      });
      if (!isEmailConfigured() && NODE_ENV !== "production") {
        devCode = otp.code;
      }
    } else if ("rateLimitSeconds" in otp) {
      // Terlalu banyak kirim ulang → beri tahu klien sisa jendela rate limit
      // (kode terakhir masih berlaku sampai kedaluwarsa).
      return NextResponse.json(
        {
          success: false,
          error: "RATE_LIMITED",
          seconds: otp.rateLimitSeconds,
        },
        { status: 429 },
      );
    } else {
      // Masih cooldown → kirim info sisa waktu (kode lama masih aktif).
      return NextResponse.json({
        success: true,
        data: { cooldownSeconds: otp.cooldownSeconds },
      });
    }

    return NextResponse.json({
      success: true,
      ...(devCode ? { data: { devCode } } : {}),
    });
  } catch (error) {
    console.error("Error requesting password change:", error);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
