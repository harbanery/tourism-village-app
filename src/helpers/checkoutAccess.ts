"use client";

/**
 * Tiket akses halaman checkout — halaman /checkout berlaku sekali:
 * hanya boleh dimasuki lewat tombol "Checkout" di halaman paket. Tombol
 * itu menerbitkan tiket (sessionStorage) yang dikonsumsi saat halaman
 * checkout dibuka; kunjungan ulang (back/refresh/URL langsung) tanpa
 * tiket → dialihkan ke halaman paket.
 */

const KEY = "tourism-village:checkoutAccess";

/** Terbitkan tiket akses checkout (dipanggil sebelum navigasi). */
export function issueCheckoutAccess(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(KEY, "1");
}

/** Cek keberadaan tiket TANPA menghapus (aman dipanggil berulang). */
export function peekCheckoutAccess(): boolean {
  if (typeof window === "undefined") return true; // SSR — biarkan render
  return window.sessionStorage.getItem(KEY) !== null;
}

/** Konsumsi tiket (hapus) — dipanggil saat halaman checkout dibuka. */
export function consumeCheckoutAccess(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(KEY);
}
