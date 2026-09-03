import { NextRequest, NextResponse } from "next/server";
import prisma from "@/server/db";
import {
  RATE_LIMIT_SCOPES,
  clearFailedAttempts,
  getClientIp,
  hashPassword,
  isIpBlocked,
  recordFailedAttempt,
} from "@/server/auth";
import { NODE_ENV } from "@/config/variables";
import { sendEmail, isEmailConfigured } from "@/server/email";
import { createOtp } from "@/server/otp";
import { buildOtpEmail } from "@/server/otpEmail";

/**
 * POST /api/web/auth/register — registrasi user web (email + password).
 *
 * Validasi lengkap (server-trusted):
 * - Nama: 2–60 karakter.
 * - Email: format valid, lowercase-unik.
 * - Password: minimal 8 karakter, mengandung huruf dan angka.
 *
 * Error terstruktur (dipetakan klien): VALIDATION, EMAIL_TAKEN,
 * BLOCKED (rate limit IP 3x gagal → 24 jam), SERVER_ERROR.
 * Setelah akun dibuat, OTP verifikasi dikirim dan user diarahkan ke /otp.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body as Record<string, unknown>;

    const ip = getClientIp(request);
    const scope = RATE_LIMIT_SCOPES.webRegister;

    if (await isIpBlocked(ip, scope)) {
      const attempt = await prisma.loginAttempt.findUnique({
        where: { ipAddress_scope: { ipAddress: ip, scope } },
      });
      const minutes = attempt?.blockedUntil
        ? Math.max(
            1,
            Math.ceil(
              (attempt.blockedUntil.getTime() - Date.now()) / (60 * 1000),
            ),
          )
        : 24 * 60;
      return NextResponse.json(
        { success: false, error: "BLOCKED", minutes },
        { status: 429 },
      );
    }

    // --- Validasi input (per field, server-trusted) ---
    const nameValid =
      typeof name === "string" &&
      name.trim().length >= 2 &&
      name.trim().length <= 60;
    const emailValid =
      typeof email === "string" &&
      /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
    // Password kuat: min 8 karakter, harus ada huruf dan angka.
    const passwordValid =
      typeof password === "string" &&
      password.length >= 8 &&
      /[A-Za-z]/.test(password) &&
      /\d/.test(password);

    if (!nameValid || !emailValid || !passwordValid) {
      await recordFailedAttempt(ip, scope);
      return NextResponse.json(
        { success: false, error: "VALIDATION" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.authUser.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      await recordFailedAttempt(ip, scope);
      return NextResponse.json(
        { success: false, error: "EMAIL_TAKEN" },
        { status: 409 },
      );
    }

    const hashed = await hashPassword(password);
    const user = await prisma.authUser.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashed,
        emailVerified: false,
      },
    });

    // OTP verifikasi email (best-effort; cooldown 60 detik antar kirim).
    const otp = await createOtp(user.id, "REGISTER_VERIFICATION");
    let devCode: string | undefined;
    if ("code" in otp) {
      void sendEmail({
        to: user.email,
        ...buildOtpEmail({ name: user.name, code: otp.code, purpose: "REGISTER_VERIFICATION" }),
      });
      // Tanpa SMTP (dev): sertakan kode di respons agar alur tetap bisa dites.
      if (!isEmailConfigured() && NODE_ENV !== "production") {
        devCode = otp.code;
      }
    }

    await clearFailedAttempts(ip, scope);

    return NextResponse.json(
      {
        success: true,
        data: { id: user.id, email: user.email, ...(devCode ? { devCode } : {}) },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error register user:", error);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
