"use client";

/**
 * Tiket akses halaman review-confirm — halaman /review-confirm berlaku
 * sekali: hanya boleh dimasuki setelah pembayaran BERHASIL (status PAID),
 * saat halaman pembayaran mengarahkan ke sana. Tiket diterbitkan tepat
 * sebelum redirect dan dikonsumsi saat halaman dibuka; kunjungan ulang
 * (back/refresh/URL langsung) tanpa tiket → dialihkan ke beranda.
 */

const KEY = "tourism-village:reviewAccess";

/** Terbitkan tiket akses review-confirm (dipanggil sebelum redirect). */
export function issueReviewAccess(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(KEY, "1");
}

/** Cek keberadaan tiket TANPA menghapus (aman dipanggil berulang). */
export function peekReviewAccess(): boolean {
  if (typeof window === "undefined") return true; // SSR — biarkan render
  return window.sessionStorage.getItem(KEY) !== null;
}

/** Konsumsi tiket (hapus) — dipanggil saat halaman review dibuka. */
export function consumeReviewAccess(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(KEY);
}
