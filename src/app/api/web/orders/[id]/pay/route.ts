import { NextResponse } from "next/server";
import prisma from "@/server/db";
import { getCurrentUser } from "@/server/auth";

/**
 * POST /api/web/orders/[id]/pay — konfirmasi pembayaran.
 *
 * Dipakai oleh:
 * - simulator lokal (Midtrans belum dikonfigurasi): tombol bayar/batal,
 * - callback onSuccess snap.js (idempoten — hanya update bila PENDING).
 */
export async function POST(
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
  if (order.paymentStatus !== "PENDING") {
    // Idempoten: jangan ubah status final (PAID/FAILED/CANCELED).
    return NextResponse.json({
      success: true,
      data: { paymentStatus: order.paymentStatus },
    });
  }

  let method = "simulator";
  let result: "PAID" | "CANCELED" = "PAID";
  try {
    const body = (await request.json()) as {
      method?: string;
      result?: "PAID" | "CANCELED";
    };
    if (body.method) method = body.method;
    if (body.result === "CANCELED") result = "CANCELED";
  } catch {
    // body opsional — pakai default
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data:
      result === "PAID"
        ? { paymentStatus: "PAID", paymentMethod: method, paidAt: new Date() }
        : { paymentStatus: "CANCELED" },
  });

  return NextResponse.json({
    success: true,
    data: { paymentStatus: updated.paymentStatus },
  });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
