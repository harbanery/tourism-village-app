import { NextResponse } from "next/server";
import prisma from "@/server/db";
import { requireAdmin } from "@/server/auth";
import { fetchMidtransStatus, isMidtransConfigured } from "@/server/midtrans";

/**
 * GET /api/admin/orders/[id]/invoice — data bukti pembayaran (invoice)
 * order mana pun untuk drawer detail pemesanan admin. Bentuk respons
 * sama persis dengan /api/web/orders/[id]/invoice sehingga perakit PDF
 * bersama (helpers/invoicePdf) bisa dipakai ulang.
 */
export async function GET(
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

  const order = await prisma.order.findFirst({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: { include: { package: true } },
    },
  });
  if (!order) {
    return NextResponse.json(
      { success: false, error: "Order not found" },
      { status: 404 },
    );
  }

  // Status transaksi Midtrans (otoritatif) — null bila tak dikonfigurasi.
  const midtrans = isMidtransConfigured()
    ? await fetchMidtransStatus(order.orderId)
    : null;

  return NextResponse.json({
    success: true,
    data: {
      orderId: order.id,
      midtransOrderId: order.orderId,
      transactionId: order.transactionId,
      paymentStatus: order.paymentStatus,
      dateOrder: order.dateOrder.toISOString(),
      dateSchedule: order.dateSchedule.toISOString(),
      homestay: order.homestay,
      homestayTime: order.homestayTime,
      totalPrice: order.totalPrice,
      paidAt: order.paidAt?.toISOString() ?? null,
      customer: {
        name: order.user.name,
        email: order.user.email,
        phone: order.user.phone,
      },
      items: order.items.map((item) => ({
        id: item.id,
        packageName: item.package.name,
        quantity: item.quantity,
        price: item.price,
        dateSchedule: item.dateSchedule?.toISOString() ?? null,
        homestay: item.homestay,
        homestayTime: item.homestayTime,
      })),
      midtrans: midtrans
        ? {
            transactionStatus: midtrans.transactionStatus,
            paymentType: midtrans.paymentType ?? "qris",
            statusCode: midtrans.statusCode,
          }
        : null,
    },
  });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
