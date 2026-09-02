import { NextResponse } from "next/server";
import prisma from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import {
  buildMidtransOrderId,
  fetchMidtransStatus,
  mapMidtransStatus,
} from "@/server/midtrans";
import { isPaymentExpired } from "@/server/orderExpiry";

/**
 * GET /api/web/orders/[id]/status — periksa & sinkronkan status pembayaran.
 *
 * Dipakai tombol "Periksa Status Pembayaran" (mis. setelah kembali dari
 * halaman Midtrans): status ditanyakan langsung ke API Midtrans lalu order
 * diperbarui — sehingga PAID terdeteksi tanpa menunggu webhook.
 * Mode simulator (Midtrans tidak dikonfigurasi) cukup membalas status DB.
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
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) {
    return NextResponse.json(
      { success: false, error: "Invalid order id" },
      { status: 400 },
    );
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
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
    current = await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "CANCELED" },
    });
  } else if (order.paymentStatus === "PENDING" && order.snapToken) {
    // Konfirmasi status ke Midtrans (otoritatif, server-to-server).
    const status = await fetchMidtransStatus(
      buildMidtransOrderId(order.id),
    );
    if (status) {
      const nextStatus = mapMidtransStatus(
        status.transactionStatus,
        status.fraudStatus,
      );
      if (nextStatus !== "PENDING") {
        current = await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: nextStatus,
            ...(nextStatus === "PAID"
              ? {
                  paymentMethod: status.paymentType ?? "midtrans",
                  paidAt: new Date(),
                }
              : {}),
          },
        });
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
