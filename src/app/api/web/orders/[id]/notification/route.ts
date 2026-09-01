import { NextResponse } from "next/server";
import prisma from "@/server/db";
import {
  mapMidtransStatus,
  parseMidtransOrderId,
  verifyMidtransSignature,
} from "@/server/midtrans";

/**
 * POST /api/web/orders/[id]/notification — webhook notification Midtrans.
 *
 * Midtrans mengirim status transaksi ke endpoint ini; signature diverifikasi
 * (sha512 order_id+status_code+gross_amount+serverKey) sebelum status order
 * diperbarui. [id] diabaikan — order ditarik dari order_id Midtrans.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  void params;

  let body: {
    order_id?: string;
    status_code?: string;
    gross_amount?: string;
    signature_key?: string;
    transaction_status?: string;
    fraud_status?: string;
    payment_type?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const orderId = parseMidtransOrderId(body.order_id ?? "");
  if (!orderId) {
    return NextResponse.json(
      { success: false, error: "Invalid order_id" },
      { status: 400 },
    );
  }

  const valid = verifyMidtransSignature({
    orderId: body.order_id ?? "",
    statusCode: body.status_code ?? "",
    grossAmount: body.gross_amount ?? "",
    signatureKey: body.signature_key ?? "",
  });
  if (!valid) {
    return NextResponse.json(
      { success: false, error: "Invalid signature" },
      { status: 403 },
    );
  }

  const nextStatus = mapMidtransStatus(
    body.transaction_status ?? "pending",
    body.fraud_status,
  );

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json(
      { success: false, error: "Order not found" },
      { status: 404 },
    );
  }

  // Status final tidak ditimpa (webhook bisa datang berkali-kali).
  if (order.paymentStatus === "PENDING") {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: nextStatus,
        ...(nextStatus === "PAID"
          ? { paymentMethod: body.payment_type ?? "midtrans", paidAt: new Date() }
          : {}),
      },
    });
  }

  // Midtrans mengharapkan 200 tanpa body error.
  return NextResponse.json({ success: true });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
