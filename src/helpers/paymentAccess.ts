"use client";

/**
 * Tiket akses halaman pembayaran — halaman /payment/[id] berlaku sekali:
 * hanya boleh dimasuki right after "Proses Order" (checkout) atau klik
 * "Bayar Sekarang" (riwayat profil). Kedua aksi itu menerbitkan tiket
 * (sessionStorage) yang dikonsumsi saat halaman dibuka; kunjungan ulang
 * (back/forward/refresh/URL langsung) tanpa tiket → dialihkan ke profil.
 */

const key = (orderId: number) => `tourism-village:paymentAccess:${orderId}`;

/** Terbitkan tiket akses untuk order (dipanggil sebelum navigasi). */
export function issuePaymentAccess(orderId: number): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(key(orderId), "1");
}

/** Cek keberadaan tiket TANPA menghapus (aman dipanggil berulang). */
export function peekPaymentAccess(orderId: number): boolean {
  if (typeof window === "undefined") return true; // SSR — biarkan render
  return window.sessionStorage.getItem(key(orderId)) !== null;
}

/** Konsumsi tiket (hapus) — dipanggil saat halaman pembayaran dibuka. */
export function consumePaymentAccess(orderId: number): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(key(orderId));
}
