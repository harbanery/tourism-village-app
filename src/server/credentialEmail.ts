import { META_APP, NOTIFICATION_LOCALE } from "@/config/variables";

/**
 * Builder email kredensial akun (admin/user) — desain rich email
 * mengikuti pola admin-portfolio: kartu header berwarna, kotak
 * kredensial, CTA, dan signature, responsif HP/tablet/laptop.
 */

const APP_NAME = META_APP ?? "Desaku Wisataku";
const THEME_COLOR = "#0d7a5f";

function L(id: string, en: string): string {
  return NOTIFICATION_LOCALE === "en" ? en : id;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface CredentialEmailPayload {
  subject: string;
  text: string;
  html: string;
}

/** Bangun payload email berisi kredensial akun baru. */
export function buildCredentialEmail(params: {
  name: string;
  username: string;
  password: string;
  loginUrl: string;
  roleLabel?: string;
  generatedAt: Date;
}): CredentialEmailPayload {
  const { name, username, password, loginUrl, roleLabel, generatedAt } = params;
  const localeTag = NOTIFICATION_LOCALE === "en" ? "en-GB" : "id-ID";
  const formattedDate = new Intl.DateTimeFormat(localeTag, {
    dateStyle: "full",
    timeStyle: "short",
  }).format(generatedAt);

  const subject = L(
    `🔐 Akun Baru — ${APP_NAME}`,
    `🔐 New Account — ${APP_NAME}`,
  );

  const text = L(
    [
      `Halo ${name}, akun Anda telah dibuat pada ${formattedDate}.`,
      "",
      roleLabel ? `Role: ${roleLabel}` : "",
      `Username: ${username}`,
      `Password: ${password}`,
      "",
      `Login di: ${loginUrl}`,
      "",
      "Simpan email ini di tempat aman lalu hapus setelah kredensial dicatat.",
    ]
      .filter(Boolean)
      .join("\n"),
    [
      `Hello ${name}, your account was created on ${formattedDate}.`,
      "",
      roleLabel ? `Role: ${roleLabel}` : "",
      `Username: ${username}`,
      `Password: ${password}`,
      "",
      `Log in at: ${loginUrl}`,
      "",
      "Keep this email safe and delete it once you have noted the credentials.",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  const html = buildCredentialEmailHtml({
    name,
    username,
    password,
    loginUrl,
    roleLabel,
    formattedDate,
  });
  return { subject, text, html };
}

function buildCredentialEmailHtml(params: {
  name: string;
  username: string;
  password: string;
  loginUrl: string;
  roleLabel?: string;
  formattedDate: string;
}): string {
  const font =
    "'Geist','Google Sans',Roboto,Helvetica,Arial,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
  const monoFont =
    "'Geist Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
  const { name, username, password, loginUrl, roleLabel, formattedDate } =
    params;

  const title = L("🔐 Kredensial Akun Baru", "🔐 Your New Account");
  const subtitle = `${APP_NAME} · ${formattedDate}`;
  const greeting = L(`Halo ${escapeHtml(name)}! 👋`, `Hello ${escapeHtml(name)}! 👋`);
  const blurf = roleLabel
    ? L(
        `Akun <strong>${roleLabel}</strong> Anda telah dibuat di <strong>${APP_NAME}</strong>. Gunakan kredensial berikut untuk masuk.`,
        `Your <strong>${roleLabel}</strong> account has been created on <strong>${APP_NAME}</strong>. Use the following credentials to sign in.`,
      )
    : L(
        `Akun Anda telah dibuat di <strong>${APP_NAME}</strong>. Gunakan kredensial berikut untuk masuk.`,
        `Your account has been created on <strong>${APP_NAME}</strong>. Use the following credentials to sign in.`,
      );

  const credentialLabel = L("Kredensial Anda", "Your Credentials");
  const usernameLabel = L("Username", "Username");
  const passwordLabel = L("Password", "Password");
  const hint = L(
    "Salin kredensial di atas dan gunakan untuk login.",
    "Copy the credentials above and use them to sign in.",
  );

  const notesHeader = L("Catatan Keamanan", "Security Notes");
  const notes = [
    L(
      "Password disimpan terenkripsi (bcrypt) — tidak dapat dilihat kembali.",
      "Passwords are stored encrypted (bcrypt) — they cannot be viewed again.",
    ),
    L(
      "Sesi login berlaku 12 jam sejak login.",
      "Login sessions last 12 hours from sign-in.",
    ),
    L(
      "Jangan bagikan kredensial ini kepada siapa pun.",
      "Do not share these credentials with anyone.",
    ),
  ];

  const ctaText = L("Masuk Sekarang", "Sign in Now");
  const ctaUrl = loginUrl;

  const closing = L(
    "Jika Anda tidak merasa membuat akun ini, abaikan email ini dan hubungi pengelola situs.",
    "If you did not request this account, ignore this email and contact the site administrator.",
  );
  const signature = L(
    `Salam hangat,<br/><strong style="color:#1f2937">${APP_NAME}</strong>`,
    `Best regards,<br/><strong style="color:#1f2937">${APP_NAME}</strong>`,
  );
  const footerNote = L(
    "Email otomatis dari sistem — tidak perlu dibalas.",
    "Automated system email — no reply needed.",
  );

  const notesRows = notes
    .map(
      (note, i) =>
        `<tr><td style="padding:8px 0;${i < notes.length - 1 ? "border-bottom:1px solid #e5e7eb;" : ""}">
        <span style="display:inline-block;width:10px;height:10px;background:${THEME_COLOR};border-radius:50%;margin-right:8px;vertical-align:middle"></span>
        <span style="font-size:14px;color:#374151">${note}</span>
      </td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="${NOTIFICATION_LOCALE}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${escapeHtml(title)}</title>
<style type="text/css">
@media screen{body,table,td,p,a,span,strong,h1{font-family:${font}}}
@media only screen and (max-width:768px){
  .email-container{max-width:100%!important;margin:0 auto!important}
  .email-body{padding:20px 18px!important}
  .email-header{padding:20px!important}
  .email-header h1{font-size:19px!important}
}
@media only screen and (max-width:480px){
  body{padding:12px!important}
  .email-container{max-width:100%!important;border-radius:8px!important}
  .email-header{padding:18px 16px!important;border-radius:8px 8px 0 0!important}
  .email-header h1{font-size:18px!important}
  .email-header p{font-size:12px!important}
  .email-body{padding:18px 14px!important;border-radius:0 0 8px 8px!important}
  .email-body p{font-size:14px!important}
  .email-credential{font-size:17px!important;letter-spacing:1px!important;padding:14px 10px!important}
  .email-cta{display:block!important;padding:12px 20px!important;font-size:13px!important}
}
</style>
<!--[if mso]>
<style type="text/css">body,table,td,p,a,span,strong,h1{font-family:Arial,sans-serif!important}</style>
<![endif]-->
</head>
<body style="margin:0;padding:24px;background:#f3f4f6;font-family:${font}">
<div class="email-container" style="font-family:${font};max-width:560px;margin:0 auto;color:#1f2937;padding:0">
  <div class="email-header" style="background:${THEME_COLOR};color:#fff;padding:24px;text-align:center;border-radius:12px 12px 0 0">
    <h1 style="font-family:${font};margin:0;font-size:22px;font-weight:700">${escapeHtml(title)}</h1>
    <p style="font-family:${font};margin:4px 0 0;font-size:13px;opacity:0.9">${escapeHtml(subtitle)}</p>
  </div>
  <div class="email-body" style="background:#f9fafb;padding:28px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
    <p style="font-family:${font};margin:0 0 16px;font-size:15px">${greeting}</p>
    <p style="font-family:${font};margin:0 0 20px;font-size:15px;line-height:1.6">${blurf}</p>
    <p style="font-family:${font};margin:0 0 8px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">${escapeHtml(credentialLabel)}</p>
    <div style="background:#ffffff;border:2px dashed ${THEME_COLOR};border-radius:10px;padding:18px 12px;text-align:center;margin:0 0 8px">
      <p style="font-family:${font};margin:0 0 10px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">${escapeHtml(usernameLabel)}</p>
      <strong class="email-credential" style="font-family:${monoFont};font-size:20px;letter-spacing:2px;color:#1f2937;word-break:break-all">${escapeHtml(username)}</strong>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:14px 0" />
      <p style="font-family:${font};margin:0 0 10px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">${escapeHtml(passwordLabel)}</p>
      <strong class="email-credential" style="font-family:${monoFont};font-size:20px;letter-spacing:2px;color:#1f2937;word-break:break-all">${escapeHtml(password)}</strong>
    </div>
    <p style="font-family:${font};margin:0 0 20px;font-size:13px;color:#6b7280;text-align:center">${escapeHtml(hint)}</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px" />
    <p style="font-family:${font};margin:0 0 8px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">${escapeHtml(notesHeader)}</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 20px;font-size:14px">${notesRows}</table>
    <div style="text-align:center;margin:24px 0 16px">
      <a href="${escapeHtml(ctaUrl)}" class="email-cta" style="font-family:${font};display:inline-block;padding:12px 32px;background:${THEME_COLOR};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">${escapeHtml(ctaText)}</a>
    </div>
    <p style="font-family:${font};margin:0 0 4px;font-size:14px;line-height:1.6">${closing}</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0 12px" />
    <p style="font-family:${font};margin:0;font-size:13px;color:#6b7280;line-height:1.5">${signature}</p>
    <p style="font-family:${font};margin:8px 0 0;font-size:12px;color:#9ca3af">${escapeHtml(footerNote)}</p>
  </div>
</div>
</body>
</html>`;
}
