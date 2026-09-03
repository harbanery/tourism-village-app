import { NextRequest, NextResponse } from "next/server";
import prisma from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { sendEmail, isEmailConfigured } from "@/server/email";
import { createOtp } from "@/server/otp";
import { buildOtpEmail } from "@/server/otpEmail";
import { NODE_ENV } from "@/config/variables";

/**
 * POST /api/web/profile/email — minta ganti email (wajib login).
 * Email baru disimpan sementara (pendingEmail) dan OTP dikirim ke email
 * BARU tersebut; email aktif berubah hanya setelah OTP diverifikasi.
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
    const { email } = body as Record<string, unknown>;

    if (typeof email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Email tidak valid." },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail === user.email) {
      return NextResponse.json(
        { success: false, error: "Email sama dengan email aktif." },
        { status: 400 },
      );
    }

    const existing = await prisma.authUser.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email sudah dipakai akun lain." },
        { status: 409 },
      );
    }

    await prisma.authUser.update({
      where: { id: user.id },
      data: { pendingEmail: normalizedEmail },
    });

    const otp = await createOtp(user.id, "EMAIL_CHANGE");
    let devCode: string | undefined;
    if ("code" in otp) {
      void sendEmail({
        to: normalizedEmail,
        ...buildOtpEmail({ name: user.name, code: otp.code, purpose: "EMAIL_CHANGE" }),
      });
      if (!isEmailConfigured() && NODE_ENV !== "production") {
        devCode = otp.code;
      }
    }

    return NextResponse.json({
      success: true,
      ...(devCode ? { data: { devCode } } : {}),
    });
  } catch (error) {
    console.error("Error requesting email change:", error);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
