/**
 * Validasi file upload di sisi server (rekomendasi 2.4): MIME dari header
 * multipart mudah dipalsukan klien — tipe gambar diverifikasi ulang dari
 * magic bytes isi file, dan ukuran dibatasi sebelum diteruskan ke
 * Cloudinary.
 */

/** Tipe gambar yang diterima (selaras hint UI: JPG/PNG/WebP + GIF). */
export const ALLOWED_IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

/** Deteksi tipe gambar dari magic bytes; null bila bukan gambar dikenal. */
export function sniffImageMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  // GIF: "GIF87a" / "GIF89a"
  if (buffer.subarray(0, 3).toString("latin1") === "GIF") {
    return "image/gif";
  }
  // WebP: "RIFF" .... "WEBP"
  if (
    buffer.subarray(0, 4).toString("latin1") === "RIFF" &&
    buffer.subarray(8, 12).toString("latin1") === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

/**
 * Validasi file gambar: ukuran ≤ maxBytes dan magic bytes cocok gambar.
 * Mengembalikan pesan error (untuk respons 400) atau null bila lolos.
 */
export function validateImageFile(
  buffer: Buffer,
  size: number,
  maxBytes: number,
): string | null {
  if (size > maxBytes) {
    return `Ukuran gambar maksimal ${Math.round(maxBytes / (1024 * 1024))}MB.`;
  }
  const mime = sniffImageMime(buffer);
  if (!mime || !(ALLOWED_IMAGE_MIME as readonly string[]).includes(mime)) {
    return "File bukan gambar yang valid (JPG/PNG/WebP/GIF).";
  }
  return null;
}
