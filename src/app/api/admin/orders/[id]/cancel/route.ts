import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, adminCanWrite } from "@/lib/auth";
import {
  cancelMidtransTransaction,
  fetchMidtransStatus,
  isMidtransConfigured,
  mapMidtransStatus,
} from "@/lib/midtrans";
import { applyPaymentTransition } from "@/utils/server/orderStatus";

/**
 * POST /api/admin/orders/[id]/cancel — batalkan order secara manual
 * (hanya MASTER; order harus PENDING). Status final tetap dikonfirmasi
 * ke Midtrans dulu: bila ternyata sudah dibayar, transisi diarahkan ke
 * PAID (bukan dibatalkan) dan permintaan cancel ditolak. QR di Midtrans
 * juga dibatalkan best-effort agar tidak terbayar setelah pembatalan.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  // Pembatalan manual mengubah data order → khusus MASTER (adminCanWrite).
  if (!adminCanWrite(admin)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { success: false, error: "Invalid order id" },
      { status: 400 },
    );
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json(
      { success: false, error: "Order not found" },
      { status: 404 },
    );
  }
  if (order.paymentStatus !== "PENDING") {
    return NextResponse.json(
      { success: false, error: "NOT_PENDING" },
      { status: 409 },
    );
  }

  // Konfirmasi status ke Midtrans (otoritatif) sebelum membatalkan —
  // hanya untuk order yang punya kanal pembayaran nyata (QR QRIS).
  if (order.qrisString && isMidtransConfigured()) {
    const status = await fetchMidtransStatus(order.orderId);
    if (status) {
      const nextStatus = mapMidtransStatus(
        status.transactionStatus,
        status.fraudStatus,
      );
      if (nextStatus !== "PENDING") {
        // Status Midtrans sudah bergeser (mis. settlement/deny/expire) —
        // ikutkan status otoritatif itu, tolak pembatalan manual.
        await applyPaymentTransition({
          orderId: order.id,
          from: "PENDING",
          to: nextStatus,
          data: {
            paymentMethod: status.paymentType ?? "midtrans",
            transactionId: status.transactionId,
          },
        });
        return NextResponse.json(
          {
            success: false,
            error: nextStatus === "PAID" ? "ALREADY_PAID" : "NOT_PENDING",
            data: { paymentStatus: nextStatus },
          },
          { status: 409 },
        );
      }
      // Masih pending di Midtrans → batalkan transaksinya di sana agar
      // QR tidak bisa dibayar setelah order dibatalkan (best-effort).
      await cancelMidtransTransaction(order.orderId);
    }
  }

  const changed = await applyPaymentTransition({
    orderId: order.id,
    from: "PENDING",
    to: "CANCELED",
  });
  if (!changed) {
    // Status bergeser di tengah jalan (race webhook) — tolak.
    return NextResponse.json(
      { success: false, error: "NOT_PENDING" },
      { status: 409 },
    );
  }

  return NextResponse.json({
    success: true,
    data: { orderId: order.id, paymentStatus: "CANCELED" },
  });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
