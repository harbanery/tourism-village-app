import prisma from "@/server/db";
import { PAYMENT_EXPIRY_MINUTES } from "@/config/variables";
import { onOrderCanceled } from "@/server/orderEvents";

/**
 * Batas waktu pembayaran order.
 *
 * - Order baru mendapat deadline `PAYMENT_EXPIRY_MINUTES` menit (dikirim juga
 *   sebagai custom_expiry ke charge QRIS sehingga QR-nya ikut kedaluwarsa).
 * - PENDING yang melewati deadline di-expire menjadi CANCELED secara lazy
 *   oleh expireStalePendingOrders() (dipanggil di endpoint order web/profil
 *   dan cron /api/cron/expire-orders) — tiap order yang baru di-expire
 *   mendapat notifikasi + email ke user (best-effort).
 */

/** Deadline pembayaran dihitung dari waktu acuan (default: sekarang). */
export function paymentDeadline(from: Date = new Date()): Date {
  return new Date(from.getTime() + PAYMENT_EXPIRY_MINUTES * 60 * 1000);
}

interface ExpirableOrder {
  paymentStatus: string;
  paymentExpiresAt: Date | null;
}

/** true bila order PENDING sudah melewati batas waktu pembayaran. */
export function isPaymentExpired(order: ExpirableOrder): boolean {
  return (
    order.paymentStatus === "PENDING" &&
    order.paymentExpiresAt !== null &&
    order.paymentExpiresAt.getTime() < Date.now()
  );
}

/**
 * Sweep lazy: tandai semua PENDING kedaluwarsa sebagai CANCELED.
 * Murah (SELECT id + satu UPDATE ... WHERE) dan idempoten; dipanggil sebelum
 * membaca daftar order / opsi pembayaran agar status selalu segar tanpa cron.
 * Order yang baru saja di-expire mendapat notifikasi + email (fire-and-forget).
 */
export async function expireStalePendingOrders(): Promise<number> {
  const expired = await prisma.order.findMany({
    where: {
      paymentStatus: "PENDING",
      paymentExpiresAt: { lt: new Date(), not: null },
    },
    select: { id: true },
  });
  if (expired.length === 0) return 0;

  const { count } = await prisma.order.updateMany({
    where: { id: { in: expired.map((row) => row.id) } },
    data: { paymentStatus: "CANCELED" },
  });

  for (const row of expired) {
    void onOrderCanceled(row.id);
  }
  return count;
}
