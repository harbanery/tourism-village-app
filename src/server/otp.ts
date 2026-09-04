import { createHash, randomBytes, randomInt } from "node:crypto";
import prisma from "@/server/db";

/**
 * Service OTP 6 digit sekali pakai (pola sesi: kode disimpan sebagai hash
 * sha256 di DB, bukan plaintext). Dipakai untuk:
 * - REGISTER_VERIFICATION: verifikasi email setelah register
 * - RESET_PASSWORD: bukti kepemilikan akun sebelum set password baru
 * - EMAIL_CHANGE: verifikasi email baru saat ganti email di pengaturan
 *
 * Kebijakan kirim ulang: jeda antar kirim 5 menit; setelah 5 kali kirim
 * ulang dalam jendela 15 menit → rate limit sampai jendela berlalu.
 */

export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
/** Jeda minimal antar kirim ulang OTP (detik) — 5 menit. */
export const OTP_RESEND_COOLDOWN_SECONDS = 5 * 60;
/** Maksimal kirim ulang sebelum kena rate limit. */
export const OTP_MAX_RESENDS = 5;
/** Jendela rate limit kirim ulang (menit). */
export const OTP_RATE_LIMIT_MINUTES = 15;

/**
 * Token reset password sekali pakai — diterbitkan setelah OTP reset
 * terverifikasi; menggantikan userId di URL halaman /reset-password
 * (privacy: identitas tidak bocor lewat query params).
 */
export const RESET_TOKEN_TTL_MINUTES = 15;
const RESET_TOKEN_PURPOSE = "RESET_PASSWORD_TOKEN";

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

/** Hasil createOtp: kode baru, sisa cooldown, atau rate limit. */
export type CreateOtpResult =
  | { code: string; resendsLeft: number }
  | { cooldownSeconds: number }
  | { rateLimitSeconds: number };

/**
 * Buat OTP baru untuk user+purpose: kode lama yang masih aktif dikonsumsi
 * dulu agar hanya satu kode valid. Rate limit: maksimal OTP_MAX_RESENDS
 * kirim ulang dalam jendela OTP_RATE_LIMIT_MINUTES.
 */
export async function createOtp(
  userId: number,
  purpose: OtpPurpose,
): Promise<CreateOtpResult> {
  // Hitung kirim dalam jendela rate limit (termasuk kirim pertama).
  const windowStart = new Date(
    Date.now() - OTP_RATE_LIMIT_MINUTES * 60 * 1000,
  );
  const recent = await prisma.otpCode.findMany({
    where: { userId, purpose, createdAt: { gt: windowStart } },
    orderBy: { createdAt: "asc" },
  });
  if (recent.length > OTP_MAX_RESENDS) {
    // Terlalu banyak kirim ulang → tunggu sampai kirim tertua keluar jendela.
    const oldest = recent[0];
    const releaseAt =
      oldest.createdAt.getTime() + OTP_RATE_LIMIT_MINUTES * 60 * 1000;
    return {
      rateLimitSeconds: Math.max(1, Math.ceil((releaseAt - Date.now()) / 1000)),
    };
  }

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
  return { code, resendsLeft: Math.max(0, OTP_MAX_RESENDS - recent.length) };
}

/**
 * Terbitkan token reset password sekali pakai (setelah OTP reset valid).
 * Token plaintext dikirim ke klien; di DB hanya hash-nya. Token lama
 * dikonsumsi agar hanya satu yang berlaku.
 */
export async function createResetToken(userId: number): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await prisma.otpCode.updateMany({
    where: { userId, purpose: RESET_TOKEN_PURPOSE, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  await prisma.otpCode.create({
    data: {
      userId,
      purpose: RESET_TOKEN_PURPOSE,
      codeHash: hashOtp(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000),
    },
  });
  return token;
}

/**
 * Verifikasi + konsumsi token reset password → userId pemilik, atau null
 * bila token tidak dikenal / sudah dipakai / kedaluwarsa.
 */
export async function verifyResetToken(
  token: string,
): Promise<number | null> {
  const row = await prisma.otpCode.findFirst({
    where: { purpose: RESET_TOKEN_PURPOSE, codeHash: hashOtp(token), consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return null;
  if (row.expiresAt.getTime() <= Date.now()) {
    await prisma.otpCode.update({
      where: { id: row.id },
      data: { consumedAt: new Date() },
    });
    return null;
  }
  await prisma.otpCode.update({
    where: { id: row.id },
    data: { consumedAt: new Date() },
  });
  return row.userId;
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
