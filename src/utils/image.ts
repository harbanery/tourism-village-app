/**
 * Helper optimasi gambar web (rekomendasi 1.1).
 *
 * URL Cloudinary disisipi transformasi delivery `f_auto,q_auto,w_{width}`
 * (format & kualitas otomatis, lebar sesuai tampilan) sehingga gambar
 * sudah dioptimasi di CDN — next/image dipakai dengan `unoptimized` agar
 * tidak dioptimasi dua kali. URL lain (non-Cloudinary) diteruskan apa
 * adanya ke optimizer next/image.
 */
export interface DisplayImage {
  /** URL final (Cloudinary sudah bertransformasi bila relevan). */
  src: string;
  /** true bila URL sudah dioptimasi CDN — bypass optimizer next/image. */
  unoptimized: boolean;
}

const CLOUDINARY_MARKER = "/image/upload/";

/** Sisipkan transformasi Cloudinary sesuai lebar tampilan gambar. */
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
