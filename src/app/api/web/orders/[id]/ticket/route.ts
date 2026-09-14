import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getClientIp, getCurrentUser } from "@/lib/auth";
import { createPageTicket } from "@/lib/otp";
import { isPaymentExpired } from "@/utils/server/orderExpiry";
import { applyPaymentTransition } from "@/utils/server/orderStatus";
import { rateLimit, tooManyRequests } from "@/utils/server/rateLimit";

/** Kuota hit endpoint ini per user per IP (rekomendasi 2.1). */
const TICKET_RATE_LIMIT = 6;

/**
 * GET /api/web/orders/[id]/ticket — terbitkan token server sekali pakai
 * (rekomendasi 2.3) untuk melanjutkan pembayaran order PENDING milik user
 * login. Dipakai tombol "Bayar Sekarang" di riwayat profil dan alur
 * order-duplikat di checkout; token lama purpose sama otomatis dikonsumsi.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { allowed, retryAfterMs } = rateLimit(
    `order-ticket:${user.id}:${getClientIp(request)}`,
    TICKET_RATE_LIMIT,
  );
  if (!allowed) return tooManyRequests(retryAfterMs);

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { success: false, error: "Invalid order id" },
      { status: 400 },
    );
  }

  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true,
      paymentStatus: true,
      paymentExpiresAt: true,
    },
  });
  if (!order) {
    return NextResponse.json(
      { success: false, error: "Order not found" },
      { status: 404 },
    );
  }

  // Kedaluwarsa? Expire menjadi CANCELED — tidak ada tiket untuk order itu.
  if (isPaymentExpired(order)) {
    await applyPaymentTransition({
      orderId: order.id,
      from: "PENDING",
      to: "CANCELED",
    });
    return NextResponse.json(
      { success: false, error: "ORDER_NOT_PAYABLE" },
      { status: 409 },
    );
  }
  if (order.paymentStatus !== "PENDING") {
    return NextResponse.json(
      { success: false, error: "ORDER_NOT_PAYABLE" },
      { status: 409 },
    );
  }

  const ticket = await createPageTicket(user.id, "ORDER_PAYMENT");
  return NextResponse.json({
    success: true,
    data: { ticket },
  });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
