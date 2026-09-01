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
