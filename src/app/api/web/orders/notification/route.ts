import { NextResponse } from "next/server";
import prisma from "@/server/db";
import { BASE_URL } from "@/config/variables";
import {
  fetchMidtransStatus,
  mapMidtransStatus,
  parseMidtransOrderId,
  verifyMidtransSignature,
} from "@/server/midtrans";
import { isPaymentExpired } from "@/server/orderExpiry";
import { onOrderCanceled, onOrderPaid } from "@/server/orderEvents";

/** Trigger notifikasi + email sesuai status akhir transisi order. */
function notifyStatusChange(orderId: number, status: string): void {
  if (status === "PAID") void onOrderPaid(orderId);
  else if (status === "FAILED" || status === "CANCELED") {
    void onOrderCanceled(orderId);
  }
}

/**
 * POST /api/web/orders/notification — webhook notification Midtrans
 * (Payment Notification URL).
 *
 * URL STATIS tanpa segmen dinamis: Midtrans cukup dipasang satu URL
 * `https://domain/api/web/orders/notification`. Order ditarik dari
 * order_id Midtrans pada payload (mis. `TOURISM-7-mtjme5ax` → id 7),
 * bukan dari path.
 *
 * Signature diverifikasi (sha512 order_id+status_code+gross_amount+
 * serverKey) sebelum status order diperbarui. Status final tidak ditimpa
 * (webhook bisa datang berkali-kali).
 */
export async function POST(request: Request) {
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
          ? {
              paymentMethod: body.payment_type ?? "qris",
              paidAt: new Date(),
            }
          : {}),
      },
    });
    notifyStatusChange(orderId, nextStatus);
  }

  // Midtrans mengharapkan 200 tanpa body error.
  return NextResponse.json({ success: true });
}

/**
 * GET /api/web/orders/notification?order_id=TOURISM-7-mtjme5ax&status_code=200&transaction_status=settlement
 *
 * Menangani Finish/Redirect URL Midtrans (browser diarahkan ke sini setelah
 * menyelesaikan pembayaran). Query param TIDAK dipercaya langsung — status
 * selalu diverifikasi ulang ke API Midtrans memakai server key, lalu user
 * di-redirect ke halaman pembayaran /payment/{id}.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const midtransOrderId = url.searchParams.get("order_id") ?? "";
  const orderId = parseMidtransOrderId(midtransOrderId);

  // Verifikasi otoritatif ke Midtrans (abaikan status di query param).
  if (orderId && midtransOrderId) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (
      order &&
      order.paymentStatus === "PENDING" &&
      !isPaymentExpired(order)
    ) {
      const status = await fetchMidtransStatus(midtransOrderId);
      if (status) {
        const nextStatus = mapMidtransStatus(
          status.transactionStatus,
          status.fraudStatus,
        );
        if (nextStatus !== "PENDING") {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: nextStatus,
              ...(nextStatus === "PAID"
                ? {
                    paymentMethod: status.paymentType ?? "qris",
                    paidAt: new Date(),
                  }
                : {}),
            },
          });
          notifyStatusChange(orderId, nextStatus);
        }
      }
    }
  }

  // Selalu arahkan user kembali ke halaman pembayaran order terkait.
  const target = orderId ? `/payment/${orderId}` : "/profile";
  return NextResponse.redirect(new URL(target, BASE_URL), 303);
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
