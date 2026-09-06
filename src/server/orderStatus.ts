import prisma from "@/server/db";
import type { PaymentStatus } from "@prisma/client";
import { onOrderCanceled, onOrderPaid } from "@/server/orderEvents";

/**
 * Transisi status pembayaran order + audit trail (rekomendasi_feature.md
 * 2.3): setiap perubahan status tercatat di tabel wisata_pesan_log
 * (orderId, fromStatus, toStatus, createdAt) dan memicu notifikasi/email
 * sesuai status akhir.
 *
 * Idempoten & aman dipanggil berkali-kali: update di-guard WHERE
 * paymentStatus = from — bila status sudah bergeser (race webhook vs
 * status page), transisi diabaikan dan tidak menulis log ganda.
 */

export interface PaymentTransitionInput {
  orderId: string;
  from: PaymentStatus;
  to: PaymentStatus;
  /** Field tambahan yang ikut ditulis saat transisi berhasil. */
  data?: {
    paymentMethod?: string | null;
    transactionId?: string | null;
  };
}

/** Terapkan transisi status + tulis OrderLog + trigger event. */
export async function applyPaymentTransition({
  orderId,
  from,
  to,
  data = {},
}: PaymentTransitionInput): Promise<boolean> {
  if (from === to) return false;

  const result = await prisma.order.updateMany({
    where: { id: orderId, paymentStatus: from },
    data: {
      paymentStatus: to,
      ...(to === "PAID" ? { paidAt: new Date() } : {}),
      ...data,
    },
  });
  if (result.count === 0) return false;

  try {
    await prisma.orderLog.create({
      data: { orderId, fromStatus: from, toStatus: to },
    });
  } catch (error) {
    // Log audit best-effort — jangan gagalkan transisi utamanya.
    console.error("Error writing order log:", error);
  }

  if (to === "PAID") void onOrderPaid(orderId);
  else if (to === "FAILED" || to === "CANCELED") {
    void onOrderCanceled(orderId);
  }
  return true;
}
