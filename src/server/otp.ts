import { createHash, randomInt } from "node:crypto";
import prisma from "@/server/db";

/**
 * Service OTP 6 digit sekali pakai (pola sesi: kode disimpan sebagai hash
 * sha256 di DB, bukan plaintext). Dipakai untuk:
 * - REGISTER_VERIFICATION: verifikasi email setelah register
 * - RESET_PASSWORD: bukti kepemilikan akun sebelum set password baru
 * - EMAIL_CHANGE: verifikasi email baru saat ganti email di pengaturan
 */

export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
/** Jeda minimal antar kirim ulang OTP (detik) — anti spam resend. */
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

export type OtpPurpose =
  | "REGISTER_VERIFICATION"
  | "RESET_PASSWORD"
  | "EMAIL_CHANGE";

export const OTP_PURPOSES: OtpPurpose[] = [
  "REGISTER_VERIFICATION",
  "RESET_PASSWORD",
  "EMAIL_CHANGE",
];

function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/** Kode OTP 6 digit (crypto random, leading zero diizinkan). */
export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * Buat OTP baru untuk user+purpose: kode lama yang masih aktif dikonsumsi
 * dulu agar hanya satu kode valid. Mengembalikan kode plaintext (untuk
 * dikirim via email) atau null bila masih dalam masa cooldown resend.
 */
export async function createOtp(
  userId: number,
  purpose: OtpPurpose,
): Promise<{ code: string } | { cooldownSeconds: number }> {
  const active = await prisma.otpCode.findFirst({
    where: { userId, purpose, consumedAt: null, createdAt: { gt: new Date(Date.now() - OTP_RESEND_COOLDOWN_SECONDS * 1000) } },
    orderBy: { createdAt: "desc" },
  });
  if (active) {
    const elapsed = Math.floor((Date.now() - active.createdAt.getTime()) / 1000);
    return { cooldownSeconds: Math.max(1, OTP_RESEND_COOLDOWN_SECONDS - elapsed) };
  }

  const code = generateOtpCode();
  await prisma.otpCode.updateMany({
    where: { userId, purpose, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  await prisma.otpCode.create({
    data: {
      userId,
      purpose,
      codeHash: hashOtp(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  });
  return { code };
}

export type OtpVerifyResult =
  | { ok: true }
  | { ok: false; reason: "NOT_FOUND" | "EXPIRED" | "TOO_MANY_ATTEMPTS"; remainingAttempts?: number };

/**
 * Verifikasi kode OTP: hitung percobaan saat salah, dan konsumsi saat
 * cocok (default). Untuk flow reset password (otp → reset → login),
 * langkah OTP memakai `consume: false`: kode hanya dicek tanpa dikonsumsi
 * karena konsumsi final terjadi di route reset-password.
 */
export async function verifyOtp(
  userId: number,
  purpose: OtpPurpose,
  code: string,
  options: { consume?: boolean } = {},
): Promise<OtpVerifyResult> {
  const { consume = true } = options;
  const otp = await prisma.otpCode.findFirst({
    where: { userId, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return { ok: false, reason: "NOT_FOUND" };
  if (otp.expiresAt.getTime() <= Date.now()) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });
    return { ok: false, reason: "EXPIRED" };
  }
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });
    return { ok: false, reason: "TOO_MANY_ATTEMPTS" };
  }
  if (otp.codeHash !== hashOtp(code)) {
    const attempts = otp.attempts + 1;
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: {
        attempts,
        ...(attempts >= OTP_MAX_ATTEMPTS ? { consumedAt: new Date() } : {}),
      },
    });
    return {
      ok: false,
      reason: attempts >= OTP_MAX_ATTEMPTS ? "TOO_MANY_ATTEMPTS" : "NOT_FOUND",
      remainingAttempts: Math.max(0, OTP_MAX_ATTEMPTS - attempts),
    };
  }

  // Kode cocok — konsumsi kecuali diminta peek (reset password).
  if (consume) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });
  }
  return { ok: true };
}
