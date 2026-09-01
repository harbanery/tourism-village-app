import nodemailer, { type Transporter } from "nodemailer";
import {
  SMTP_FROM,
  SMTP_HOST,
  SMTP_PASS,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
} from "@/config/variables";

/**
 * Service pengiriman email via Nodemailer (SMTP) — pola admin-portfolio.
 * Bila SMTP belum dikonfigurasi (SMTP_HOST kosong), channel ini otomatis
 * diabaikan agar tetap berjalan di environment tanpa email.
 */

let transporter: Transporter | null = null;

export function isEmailConfigured(): boolean {
  return Boolean(SMTP_HOST && SMTP_USER);
}

function getTransporter(): Transporter {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
  return transporter;
}

interface EmailPayload {
  to: string;
  subject: string;
  /** Versi teks polos (fallback). */
  text: string;
  /** Versi HTML rich email. */
  html: string;
}

/** Kirim email. Mengembalikan true jika berhasil. */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  try {
    const transport = getTransporter();
    await transport.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
    return true;
  } catch (err) {
    console.error("[email] error sending:", err);
    return false;
  }
}
