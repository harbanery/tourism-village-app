import { NextResponse } from "next/server";
import prisma from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { isPaymentExpired, paymentDeadline } from "@/server/orderExpiry";
import { customerFromUser, ensureOrderQris } from "@/server/qris";

/**
 * GET /api/web/orders/[id]/pay — lanjutkan pembayaran order PENDING.
 *
 * Dipakai halaman /payment/[id] dan tombol "Bayar" di riwayat profil:
 * memastikan QR QRIS tersedia (dibuat sekali via Core API, lalu dipakai
 * ulang) untuk order milik user login.
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
    include: { items: { include: { package: true } } },
  });
  if (!order) {
    return NextResponse.json(
      { success: false, error: "Order not found" },
      { status: 404 },
    );
  }

  // Kedaluwarsa? Expire menjadi CANCELED — tidak ada opsi pembayaran lagi.
  if (isPaymentExpired(order)) {
    const expired = await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "CANCELED" },
    });
    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        paymentStatus: expired.paymentStatus,
        expired: true,
        payment: null,
      },
    });
  }

  // Order final (PAID/FAILED/CANCELED) tidak punya opsi pembayaran.
  if (order.paymentStatus !== "PENDING") {
    return NextResponse.json({
      success: true,
      data: { orderId: order.id, paymentStatus: order.paymentStatus, payment: null },
    });
  }

  // QRIS POS integration: pastikan QR tersedia (dibuat sekali, lalu reuse).
  const qris = await ensureOrderQris({
    order,
    customer: customerFromUser(user),
  });
  // Order lama tanpa deadline mendapat deadline baru saat resume.
  let effectiveExpiresAt = order.paymentExpiresAt;
  if (!order.paymentExpiresAt) {
    effectiveExpiresAt = await prisma.order
      .update({
        where: { id: order.id },
        data: { paymentExpiresAt: paymentDeadline() },
      })
      .then((o) => o.paymentExpiresAt);
  }

  return NextResponse.json({
    success: true,
    data: {
      orderId: order.id,
      totalPrice: order.totalPrice,
      paymentStatus: order.paymentStatus,
      paymentExpiresAt: effectiveExpiresAt?.toISOString() ?? null,
      payment: {
        /** null = QR belum tersedia (Midtrans tidak dikonfigurasi / gagal). */
        qris: qris
          ? { qrString: qris.qrString, qrImageUrl: qris.qrImageUrl }
          : null,
      },
    },
  });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
