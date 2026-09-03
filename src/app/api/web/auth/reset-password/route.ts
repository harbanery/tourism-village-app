import { NextRequest, NextResponse } from "next/server";
import prisma from "@/server/db";
import { hashPassword } from "@/server/auth";
import { verifyOtp } from "@/server/otp";

/**
 * POST /api/web/auth/reset-password — set password baru setelah OTP benar.
 * Semua sesi lama dicabut (paksa logout semua perangkat).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, password } = body as Record<string, unknown>;

    if (
      typeof email !== "string" ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
      typeof code !== "string" ||
      !/^\d{6}$/.test(code) ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return NextResponse.json(
        { success: false, error: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const user = await prisma.authUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "INVALID_OTP" },
        { status: 400 },
      );
    }

    const result = await verifyOtp(user.id, "RESET_PASSWORD", code);
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

    await prisma.$transaction([
      prisma.authUser.update({
        where: { id: user.id },
        data: { password: await hashPassword(password) },
      }),
      // Cabut semua sesi lama setelah password diganti.
      prisma.userSession.deleteMany({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reset password:", error);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
