import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { verifyOtp } from "@/lib/otp";
import { passwordChangedEmail } from "@/utils/email/emailTemplates";

function isNewPasswordValid(password: string): boolean {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

/**
 * POST /api/web/profile/password/verify — verifikasi OTP ganti password
 * (wajib login; OTP dikirim ke email aktif). Saat cocok: password baru
 * diterapkan, SEMUA sesi login user dicabut (termasuk sesi ini — klien
 * diarahkan ke halaman login), lalu email notifikasi keamanan dikirim
 * (best-effort).
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
    const { code, newPassword } = body as Record<string, unknown>;

    if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: "INVALID_BODY" },
        { status: 400 },
      );
    }
    if (typeof newPassword !== "string" || !isNewPasswordValid(newPassword)) {
      return NextResponse.json(
        { success: false, error: "NEW_PASSWORD_INVALID" },
        { status: 400 },
      );
    }

    const result = await verifyOtp(user.id, "PASSWORD_CHANGE", code);
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

    // Terapkan password baru + cabut semua sesi (transaksi atomik).
    await prisma.$transaction([
      prisma.authUser.update({
        where: { id: user.id },
        data: { password: await hashPassword(newPassword) },
      }),
      prisma.userSession.deleteMany({ where: { userId: user.id } }),
    ]);

    // Security notice (best-effort, tidak memblok respons).
    void sendEmail({
      to: user.email,
      ...passwordChangedEmail({ userName: user.name, email: user.email }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error verifying password change:", error);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
