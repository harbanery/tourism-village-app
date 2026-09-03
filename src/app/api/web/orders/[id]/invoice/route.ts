import { NextResponse } from "next/server";
import prisma from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import {
  buildMidtransOrderId,
  fetchMidtransStatus,
  isMidtransConfigured,
} from "@/server/midtrans";

/**
 * GET /api/web/orders/[id]/invoice — data bukti pembayaran (invoice)
 * milik order pengguna. Sumber kebenaran transaksi diambil langsung dari
 * Midtrans (GET /v2/{order_id}/status) bila dikonfigurasi; digabung
 * dengan data order lokal untuk dirakit menjadi invoice oleh client.
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

  // Status transaksi Midtrans (otoritatif) — null bila tak dikonfigurasi.
  const midtrans = isMidtransConfigured()
    ? await fetchMidtransStatus(buildMidtransOrderId(order.id))
    : null;

  return NextResponse.json({
    success: true,
    data: {
      orderId: order.id,
      midtransOrderId: buildMidtransOrderId(order.id),
      paymentStatus: order.paymentStatus,
      dateOrder: order.dateOrder.toISOString(),
      dateSchedule: order.dateSchedule.toISOString(),
      homestay: order.homestay,
      homestayTime: order.homestayTime,
      totalPrice: order.totalPrice,
      paidAt: order.paidAt?.toISOString() ?? null,
      customer: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      items: order.items.map((item) => ({
        id: item.id,
        packageName: item.package.name,
        quantity: item.quantity,
        price: item.price,
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
