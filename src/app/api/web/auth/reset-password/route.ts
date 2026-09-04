import { NextRequest, NextResponse } from "next/server";
import prisma from "@/server/db";
import { hashPassword, verifyPassword } from "@/server/auth";
import { verifyResetToken } from "@/server/otp";

/**
 * POST /api/web/auth/reset-password — set password baru memakai token
 * reset sekali pakai (flow: lupa password → otp → token → reset → login).
 * Token diterbitkan saat OTP diverifikasi (verify-otp) dan langsung
 * dikonsumsi di sini — tanpa userId/code di body (privasi: identitas
 * tidak lewat URL/body yang mudah dibaca).
 * Password baru tidak boleh sama dengan password lama.
 * Semua sesi lama dicabut (paksa logout semua perangkat).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body as Record<string, unknown>;

    if (
      typeof token !== "string" ||
      !/^[0-9a-f]{64}$/.test(token) ||
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

    // Verifikasi + konsumsi token reset (sekali pakai, TTL 15 menit).
    const userId = await verifyResetToken(token);
    if (userId === null) {
      return NextResponse.json(
        { success: false, error: "TOKEN_INVALID" },
        { status: 400 },
      );
    }

    const user = await prisma.authUser.findUnique({
      where: { id: userId },
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
