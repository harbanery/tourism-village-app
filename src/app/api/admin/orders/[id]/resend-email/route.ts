import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import {
  orderConfirmationEmail,
  orderPaidEmail,
  type OrderEmailData,
} from "@/utils/email/emailTemplates";

/**
 * POST /api/admin/orders/[id]/resend-email — kirim ulang email
 * invoice/receipt ke pemesan (aksi eksplisit admin, melewati preferensi
 * notifEmail agar permintaan admin tidak "hangus" diam-diam).
 * PENDING → email invoice (konfirmasi + batas bayar); PAID → email
 * receipt (bukti pembayaran). Status lain ditolak.
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

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { package: { select: { name: true } } } },
    },
  });
  if (!order) {
    return NextResponse.json(
      { success: false, error: "Order not found" },
      { status: 404 },
    );
  }

  if (order.paymentStatus !== "PENDING" && order.paymentStatus !== "PAID") {
    return NextResponse.json(
      { success: false, error: "INVALID_STATUS" },
      { status: 409 },
    );
  }

  // Rakit data email (bentuk sama dengan orderEvents.toEmailData).
  const emailData: OrderEmailData = {
    orderId: order.id,
    userName: order.user.name,
    totalPrice: order.totalPrice,
    paymentExpiresAt: order.paymentExpiresAt,
    paidAt: order.paidAt,
    items: order.items.map((item) => ({
      packageName: item.package.name,
      quantity: item.quantity,
      price: item.price,
      dateSchedule: item.dateSchedule,
      homestay: item.homestay,
      homestayTime: item.homestayTime,
    })),
  };

  // PENDING → invoice (konfirmasi pesanan), PAID → receipt (bukti bayar).
  const content =
    order.paymentStatus === "PAID"
      ? orderPaidEmail(emailData)
      : orderConfirmationEmail(emailData);

  const sent = await sendEmail({ to: order.user.email, ...content });
  if (!sent) {
    // SMTP belum dikonfigurasi / gagal kirim — dilaporkan ke admin.
    return NextResponse.json(
      { success: false, error: "EMAIL_UNAVAILABLE" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    data: { recipient: order.user.email },
  });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
