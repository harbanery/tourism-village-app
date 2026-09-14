"use client";

/**
 * Token akses server sekali pakai (rekomendasi 2.3) — pendamping tiket
 * sessionStorage (paymentAccess/reviewAccess): token ini DITERBITKAN
 * SERVER (terikat user + purpose, berkedaluwarsa) dan dikirim sebagai
 * header saat memanggil endpoint sensitif:
 *
 * - x-payment-ticket → GET /api/web/orders/[id]/pay (QR QRIS);
 * - x-review-ticket  → POST /api/web/testimonials (kirim ulasan).
 *
 * Disimpan di sessionStorage (per tab, hilang saat tab ditutup) — selaras
 * semantik "halaman sekali masuk".
 */

const PAYMENT_KEY = "tourism-village:paymentTicket";
const REVIEW_KEY = "tourism-village:reviewTicket";

interface PaymentTicketRecord {
  orderId: string;
  token: string;
}

/** Simpan token pembayaran untuk order aktif (satu dalam satu waktu). */
export function setPaymentTicket(orderId: string, token: string): void {
  if (typeof window === "undefined" || !token) return;
  const record: PaymentTicketRecord = { orderId, token };
  window.sessionStorage.setItem(PAYMENT_KEY, JSON.stringify(record));
}

/** Ambil token pembayaran order (null bila tidak ada / order berbeda). */
export function getPaymentTicket(orderId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PAYMENT_KEY);
    if (!raw) return null;
    const record = JSON.parse(raw) as PaymentTicketRecord;
    return record.orderId === orderId ? record.token : null;
  } catch {
    return null;
  }
}

/** Hapus token pembayaran (setelah selesai/dibatalkan). */
export function clearPaymentTicket(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PAYMENT_KEY);
}

/** Simpan token ulasan (diterima saat status pembayaran PAID). */
export function setReviewTicket(token: string): void {
  if (typeof window === "undefined" || !token) return;
  window.sessionStorage.setItem(REVIEW_KEY, token);
}

/** Ambil token ulasan (null bila belum ada). */
export function getReviewTicket(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(REVIEW_KEY);
}
