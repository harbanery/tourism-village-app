export const META_TITLE: string | undefined = process.env.TITLE_WEB;
export const META_APP: string | undefined = process.env.APP_WEB;
export const META_DESCRIPTION: string | undefined = process.env.DESCRIPTION_WEB;

export const BASE_URL: string =
  process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";

export const NODE_ENV: string = process.env.NODE_ENV || "development";

// ---------------------------------------------------------------------------
// Autentikasi
// ---------------------------------------------------------------------------

/** Nama cookie sesi admin (panel /admin). */
export const ADMIN_SESSION_COOKIE = "tourism_admin_session";

/** Nama cookie sesi user web. */
export const USER_SESSION_COOKIE = "tourism_user_session";

/** Durasi sesi login (jam). */
export const SESSION_TTL_HOURS = 12;

// ---------------------------------------------------------------------------
// SMTP (Nodemailer) — pola admin-portfolio / progress-self
// ---------------------------------------------------------------------------

export const SMTP_HOST: string = process.env.SMTP_HOST || "";
export const SMTP_PORT: number = Number(process.env.SMTP_PORT || "465");
const SMTP_SECURE_RAW = process.env.SMTP_SECURE ?? "";
export const SMTP_SECURE: boolean =
  SMTP_SECURE_RAW === "" ? SMTP_PORT === 465 : SMTP_SECURE_RAW === "true";
export const SMTP_USER: string = process.env.SMTP_USER || "";
export const SMTP_PASS: string = process.env.SMTP_PASS || "";
export const SMTP_FROM: string = process.env.SMTP_FROM || SMTP_USER;

/** Bahasa konten email server-side (id | en). Default "id". */
export type NotificationLocale = "id" | "en";
export const NOTIFICATION_LOCALE: NotificationLocale =
  process.env.NOTIFICATION_LOCALE === "en" ? "en" : "id";

// ---------------------------------------------------------------------------
// Cron — secret untuk endpoint /api/cron/* (header Authorization: Bearer)
// ---------------------------------------------------------------------------

/** Secret bersama antara scheduler (Vercel Cron/eksternal) dan endpoint cron. */
export const CRON_SECRET: string = process.env.CRON_SECRET || "";

// ---------------------------------------------------------------------------
// Midtrans (Core API — QRIS POS integration)
// ---------------------------------------------------------------------------

/** Server key Midtrans (SB-Mid-server-... untuk sandbox). */
export const MIDTRANS_SERVER_KEY: string = process.env.MIDTRANS_SERVER_KEY || "";

/** true bila memakai api production (selain itu sandbox). */
export const MIDTRANS_IS_PRODUCTION: boolean =
  process.env.MIDTRANS_ENV === "production";

/** Midtrans aktif bila server key terisi. */
export const MIDTRANS_IS_CONFIGURED: boolean = MIDTRANS_SERVER_KEY !== "";

/**
 * Batas waktu pembayaran order (menit). PENDING yang melewati batas ini
 * di-expire menjadi CANCELED (dikirim juga sebagai custom_expiry ke
 * charge QRIS agar QR ikut kedaluwarsa di sisi Midtrans).
 * Default 5 menit — jangka pendek agar slot jadwal tidak terkunci lama.
 */
export const PAYMENT_EXPIRY_MINUTES: number = Math.max(
  1,
  Number(process.env.PAYMENT_EXPIRY_MINUTES || "5"),
);

/** Base URL Core API v2 Midtrans (charge + status transaksi). */
export const MIDTRANS_CORE_API_URL: string = MIDTRANS_IS_PRODUCTION
  ? "https://api.midtrans.com/v2"
  : "https://api.sandbox.midtrans.com/v2";

// ---------------------------------------------------------------------------
// Cloudinary
// ---------------------------------------------------------------------------

/** Root folder aset aplikasi ini di Cloudinary. */
export const UPLOAD_ROOT_FOLDER = "tourism-village";

/** Opsi fasilitas paket wisata (multiple select). */
export const FACILITY_OPTIONS = [
  "Jasa Pemandu",
  "Peralatan",
  "Asuransi",
  "Transportasi",
] as const;

/** Maksimal jumlah ulasan berstatus utama (featured). */
export const MAX_FEATURED_TESTIMONIALS = 3;
