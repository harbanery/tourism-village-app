import { META_APP, NOTIFICATION_LOCALE } from "@/config/variables";
import { OTP_TTL_MINUTES, type OtpPurpose } from "@/server/otp";

/**
 * Builder email OTP — desain mengikuti pola credentialEmail: kartu header
 * berwarna, kotak kode besar, dan signature, responsif HP/tablet/laptop.
 */

const APP_NAME = META_APP ?? "Desaku Wisataku";
const THEME_COLOR = "#0d7a5f";

function L(id: string, en: string): string {
  return NOTIFICATION_LOCALE === "en" ? en : id;
}

function purposeLabel(purpose: OtpPurpose): { id: string; en: string } {
  switch (purpose) {
    case "REGISTER_VERIFICATION":
      return {
        id: "Verifikasi pendaftaran akun",
        en: "Account registration verification",
      };
    case "RESET_PASSWORD":
      return { id: "Atur ulang password", en: "Reset your password" };
    case "EMAIL_CHANGE":
      return { id: "Verifikasi email baru", en: "Verify your new email" };
  }
}

export interface OtpEmailPayload {
  subject: string;
  text: string;
  html: string;
}

/** Bangun payload email berisi kode OTP. */
export function buildOtpEmail(params: {
  name: string;
  code: string;
  purpose: OtpPurpose;
}): OtpEmailPayload {
  const label = purposeLabel(params.purpose);
  const isId = NOTIFICATION_LOCALE === "id";

  const subject = L(
    `🔑 Kode OTP — ${APP_NAME}`,
    `🔑 OTP Code — ${APP_NAME}`,
  );

  const text = L(
    [
      `Halo ${params.name},`,
      "",
      `Kode OTP untuk ${label.id}:`,
      "",
      params.code,
      "",
      `Berlaku ${OTP_TTL_MINUTES} menit. Jangan bagikan kode ini kepada siapa pun.`,
    ].join("\n"),
    [
      `Hello ${params.name},`,
      "",
      `Your OTP code for ${label.en}:`,
      "",
      params.code,
      "",
      `Valid for ${OTP_TTL_MINUTES} minutes. Do not share this code with anyone.`,
    ].join("\n"),
  );

  const html = `<!DOCTYPE html>
<html lang="${isId ? "id" : "en"}">
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e9ec;">
        <tr>
          <td style="background:${THEME_COLOR};padding:20px 24px;color:#ffffff;font-size:18px;font-weight:bold;">
            ${APP_NAME}
          </td>
        </tr>
        <tr>
          <td style="padding:24px;color:#1f2933;font-size:14px;line-height:1.6;">
            <p style="margin:0 0 8px;">${L(`Halo <b>${params.name}</b>,`, `Hello <b>${params.name}</b>,`)}</p>
            <p style="margin:0 0 16px;color:#52606d;">
              ${L(`Kode OTP untuk <b>${label.id}</b>:`, `Your OTP code for <b>${label.en}</b>:`)}
            </p>
            <div style="text-align:center;margin:0 0 16px;">
              <span style="display:inline-block;padding:12px 24px;border:1px dashed ${THEME_COLOR};border-radius:10px;font-size:28px;letter-spacing:8px;font-weight:bold;color:${THEME_COLOR};background:#f0faf7;">
                ${params.code}
              </span>
            </div>
            <p style="margin:0;color:#52606d;">
              ${L(
                `Berlaku <b>${OTP_TTL_MINUTES} menit</b>. Jangan bagikan kode ini kepada siapa pun, termasuk pihak yang mengaku dari ${APP_NAME}.`,
                `Valid for <b>${OTP_TTL_MINUTES} minutes</b>. Do not share this code with anyone, including anyone claiming to be from ${APP_NAME}.`,
              )}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px;background:#f8fafc;color:#8794a1;font-size:12px;text-align:center;">
            © ${new Date().getFullYear()} ${APP_NAME}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}
