/**
 * Helper fungsi murni global (format, slug, gambar) — digabung satu file
 * agar folder utils tetap ringkas (rekomendasi struktur proyek).
 */

// ------------------------------------------------------------
// Format
// ------------------------------------------------------------

export function formatRupiah(value: number): string {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

export function formatDate(
  value: string | Date,
  locale: "id" | "en" = "id",
  withTime = false,
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" } : {}),
  }).format(date);
}

// ------------------------------------------------------------
// Slug
// ------------------------------------------------------------

/**
 * Slug URL kebab-case dari judul (dipakai blog: /blog/[slug]).
 * Non-alfanumerik menjadi "-", di-trim, maksimum 80 karakter.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // buang diakritik (é → e)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

// ------------------------------------------------------------
// Gambar
// ------------------------------------------------------------

export interface DisplayImage {
  /** URL final (Cloudinary sudah bertransformasi bila relevan). */
  src: string;
  /** true bila URL sudah dioptimasi CDN — bypass optimizer next/image. */
  unoptimized: boolean;
}

const CLOUDINARY_MARKER = "/image/upload/";

/**
 * Sisipkan transformasi Cloudinary sesuai lebar tampilan gambar:
 * `f_auto,q_auto,w_{width}` (format & kualitas otomatis) sehingga gambar
 * sudah dioptimasi di CDN — next/image dipakai dengan `unoptimized` agar
 * tidak dioptimasi dua kali. URL non-Cloudinary diteruskan apa adanya.
 */
export function displayImage(raw: string, width: number): DisplayImage {
  if (raw.includes(CLOUDINARY_MARKER)) {
    const src = raw.replace(
      CLOUDINARY_MARKER,
      `${CLOUDINARY_MARKER}f_auto,q_auto,w_${width}/`,
    );
    return { src, unoptimized: true };
  }
  return { src: raw, unoptimized: false };
}
