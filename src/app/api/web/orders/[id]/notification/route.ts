import { NextResponse } from "next/server";
import prisma from "@/server/db";
import { BASE_URL } from "@/config/variables";
import {
  fetchMidtransStatus,
  mapMidtransStatus,
  parseMidtransOrderId,
  verifyMidtransSignature,
} from "@/server/midtrans";

/**
 * POST /api/web/orders/[id]/notification — webhook notification Midtrans
 * (Payment Notification URL).
 *
 * Midtrans mengirim status transaksi ke endpoint ini; signature diverifikasi
 * (sha512 order_id+status_code+gross_amount+serverKey) sebelum status order
 * diperbarui. [id] diabaikan — order ditarik dari order_id Midtrans.
 *
 * Link yang sama bisa dipasang sebagai Finish/Redirect URL — lihat GET.
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

/**
 * GET /api/web/orders/[id]/notification?order_id=TOURISM-7-xxx&status_code=200&transaction_status=settlement
 *
 * Menangani Finish/Redirect URL Midtrans (browser diarahkan ke sini setelah
 * menyelesaikan pembayaran di halaman Midtrans). Query param TIDAK dipercaya
 * langsung — status selalu diverifikasi ulang ke API Midtrans memakai server
 * key, lalu user di-redirect ke halaman pembayaran /payment/{id}.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  void params;

  const url = new URL(request.url);
  const midtransOrderId = url.searchParams.get("order_id") ?? "";
  const orderId = parseMidtransOrderId(midtransOrderId);

  // Verifikasi otoritatif ke Midtrans (abaikan status di query param).
  if (orderId && midtransOrderId) {
    const status = await fetchMidtransStatus(midtransOrderId);
    if (status) {
      const nextStatus = mapMidtransStatus(
        status.transactionStatus,
        status.fraudStatus,
      );
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      // Status final tidak ditimpa (bisa dipanggil berkali-kali).
      if (order && order.paymentStatus === "PENDING") {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: nextStatus,
            ...(nextStatus === "PAID"
              ? { paymentMethod: status.paymentType ?? "midtrans", paidAt: new Date() }
              : {}),
          },
        });
      }
    }
  }

  // Selalu arahkan user kembali ke halaman pembayaran order terkait.
  const target = orderId ? `/payment/${orderId}` : "/profile";
  return NextResponse.redirect(new URL(target, BASE_URL), 303);
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
