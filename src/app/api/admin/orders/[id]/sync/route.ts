import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  fetchMidtransStatus,
  isMidtransConfigured,
  mapMidtransStatus,
} from "@/lib/midtrans";
import { isPaymentExpired } from "@/utils/server/orderExpiry";
import { applyPaymentTransition } from "@/utils/server/orderStatus";

/**
 * POST /api/admin/orders/[id]/sync — sinkronkan status order dengan
 * status transaksi Midtrans (GET /v2/{order_id}/status, otoritatif).
 * Aksi bersifat baca+reconcile → boleh dipakai MASTER & VIEWER (role
 * yang memiliki menu order). Transisi dipakai dari status saat ini dan
 * idempoten (guard WHERE paymentStatus = from di applyPaymentTransition).
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

  // PENDING lewat batas waktu → CANCELED (sama seperti sweep cron).
  if (order.paymentStatus === "PENDING" && isPaymentExpired(order)) {
    const changed = await applyPaymentTransition({
      orderId: order.id,
      from: "PENDING",
      to: "CANCELED",
    });
    return NextResponse.json({
      success: true,
      data: {
        paymentStatus: changed ? "CANCELED" : order.paymentStatus,
        changed,
        midtransStatus: "expire",
      },
    });
  }

  if (!isMidtransConfigured()) {
    return NextResponse.json(
      { success: false, error: "MIDTRANS_UNAVAILABLE" },
      { status: 409 },
    );
  }

  const status = await fetchMidtransStatus(order.orderId);
  if (!status) {
    // 404 = order_id belum dikenal Midtrans (mis. order tanpa QR).
    return NextResponse.json(
      { success: false, error: "MIDTRANS_UNAVAILABLE" },
      { status: 409 },
    );
  }

  const nextStatus = mapMidtransStatus(
    status.transactionStatus,
    status.fraudStatus,
  );
  let changed = false;
  if (nextStatus !== order.paymentStatus) {
    changed = await applyPaymentTransition({
      orderId: order.id,
      from: order.paymentStatus,
      to: nextStatus,
      data: {
        paymentMethod: status.paymentType ?? "midtrans",
        transactionId: status.transactionId,
      },
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      orderId: order.id,
      paymentStatus: changed ? nextStatus : order.paymentStatus,
      changed,
      midtransStatus: status.transactionStatus,
    },
  });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
