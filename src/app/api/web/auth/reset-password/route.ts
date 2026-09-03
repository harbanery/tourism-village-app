import { NextRequest, NextResponse } from "next/server";
import prisma from "@/server/db";
import { hashPassword, verifyPassword } from "@/server/auth";
import { verifyOtp } from "@/server/otp";

/**
 * POST /api/web/auth/reset-password — set password baru setelah OTP reset
 * terverifikasi di halaman /otp (flow: lupa password → otp → reset → login).
 * Kode OTP WAJIB diverifikasi ulang di sini (dan dikonsumsi final) —
 * bukti kepemilikan akun tidak boleh hanya "ada OTP aktif".
 * Password baru tidak boleh sama dengan password lama.
 * Semua sesi lama dicabut (paksa logout semua perangkat).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, code, password } = body as Record<string, unknown>;

    const parsedUserId = Number(userId);
    if (
      !Number.isInteger(parsedUserId) ||
      typeof code !== "string" ||
      !/^\d{6}$/.test(code) ||
      typeof password !== "string" ||
      password.length < 8 ||
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password)
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
        { success: false, error: "SESSION_MISSING" },
        { status: 400 },
      );
    }

    // Password baru tidak boleh sama dengan yang lama.
    const sameAsOld = await verifyPassword(password, user.password);
    if (sameAsOld) {
      return NextResponse.json(
        { success: false, error: "PASSWORD_SAME_AS_OLD" },
        { status: 400 },
      );
    }

    // Verifikasi + konsumsi final OTP RESET_PASSWORD (di halaman /otp kode
    // hanya di-peek). Ini bukti kepemilikan akun yang sebenarnya.
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
