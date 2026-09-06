import { NextResponse } from "next/server";
import prisma from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { fetchMidtransStatus, mapMidtransStatus } from "@/server/midtrans";
import { isPaymentExpired } from "@/server/orderExpiry";
import { applyPaymentTransition } from "@/server/orderStatus";

/**
 * GET /api/web/orders/[id]/status — periksa & sinkronkan status pembayaran.
 *
 * Dipakai tombol "Periksa Status Pembayaran" (dan auto-poll halaman
 * pembayaran): status ditanyakan langsung ke API Midtrans lalu order
 * diperbarui — sehingga PAID terdeteksi tanpa menunggu webhook.
 * Tanpa QR (Midtrans tidak dikonfigurasi) cukup membalas status DB.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { success: false, error: "Invalid order id" },
      { status: 400 },
    );
  }

  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
  });
  if (!order) {
    return NextResponse.json(
      { success: false, error: "Order not found" },
      { status: 404 },
    );
  }

  let current = order;

  // PENDING + kedaluwarsa → CANCELED.
  if (isPaymentExpired(order)) {
    const changed = await applyPaymentTransition({
      orderId: order.id,
      from: "PENDING",
      to: "CANCELED",
    });
    if (changed) current = { ...current, paymentStatus: "CANCELED" };
  } else if (
    order.paymentStatus === "PENDING" &&
    // Ada kanal pembayaran nyata: QR QRIS pernah dibuat.
    order.qrisString
  ) {
    // Konfirmasi status ke Midtrans (otoritatif, server-to-server)
    // memakai order_id (TOURISM-{uuid}{YYYYMMDD}) yang tersimpan.
    const status = await fetchMidtransStatus(order.orderId);
    if (status) {
      const nextStatus = mapMidtransStatus(
        status.transactionStatus,
        status.fraudStatus,
      );
      if (nextStatus !== "PENDING") {
        const changed = await applyPaymentTransition({
          orderId: order.id,
          from: "PENDING",
          to: nextStatus,
          data: {
            paymentMethod: status.paymentType ?? "midtrans",
            transactionId: status.transactionId,
          },
        });
        if (changed) {
          current = {
            ...current,
            paymentStatus: nextStatus,
            paymentMethod: status.paymentType ?? "midtrans",
            transactionId: status.transactionId,
          };
        }
      }
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      orderId: current.id,
      paymentStatus: current.paymentStatus,
      paymentMethod: current.paymentMethod,
      paidAt: current.paidAt?.toISOString() ?? null,
      paymentExpiresAt: current.paymentExpiresAt?.toISOString() ?? null,
    },
  });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
