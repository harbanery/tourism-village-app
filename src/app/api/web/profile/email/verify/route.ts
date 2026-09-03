import { NextRequest, NextResponse } from "next/server";
import prisma from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { verifyOtp } from "@/server/otp";

/**
 * POST /api/web/profile/email/verify — verifikasi OTP ganti email
 * (wajib login; OTP dikirim ke email baru). Terapkan email baru saat cocok.
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
    if (!user.pendingEmail) {
      return NextResponse.json(
        { success: false, error: "Tidak ada permintaan ganti email." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { code } = body as Record<string, unknown>;
    if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const result = await verifyOtp(user.id, "EMAIL_CHANGE", code);
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

    // Email baru bisa saja dipakai orang lain sejak permintaan dibuat.
    const clash = await prisma.authUser.findUnique({
      where: { email: user.pendingEmail },
    });
    if (clash) {
      await prisma.authUser.update({
        where: { id: user.id },
        data: { pendingEmail: null },
      });
      return NextResponse.json(
        { success: false, error: "Email sudah dipakai akun lain." },
        { status: 409 },
      );
    }

    const updated = await prisma.authUser.update({
      where: { id: user.id },
      data: { email: user.pendingEmail, pendingEmail: null, emailVerified: true },
      select: { id: true, email: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error verifying email change:", error);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
