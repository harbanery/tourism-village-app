import { NextResponse } from "next/server";
import prisma from "@/server/db";
import { BASE_URL } from "@/config/variables";
import {
  fetchMidtransStatus,
  mapMidtransStatus,
  parseLegacyMidtransOrderId,
  verifyMidtransSignature,
} from "@/server/midtrans";
import { isPaymentExpired } from "@/server/orderExpiry";
import { applyPaymentTransition } from "@/server/orderStatus";
import type { Order } from "@prisma/client";

/**
 * POST /api/web/orders/notification — webhook notification Midtrans
 * (Payment Notification URL).
 *
 * URL STATIS tanpa segmen dinamis: Midtrans cukup dipasang satu URL
 * `https://domain/api/web/orders/notification`. Order ditarik dari
 * order_id Midtrans pada payload — kode `TOURISM-{uuid}{YYYYMMDD}`
 * tersimpan di kolom order_id (data lama TOURISM-{int} di-parse).
 *
 * Signature diverifikasi (sha512 order_id+status_code+gross_amount+
 * serverKey) sebelum status order diperbarui. Status final tidak ditimpa
 * (webhook bisa datang berkali-kali); setiap transisi tercatat di
 * wisata_pesan_log + transaction_id Midtrans disimpan (rekomendasi 2.3).
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
    transaction_id?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
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

  // Cari order berdasarkan kode (kolom order_id); fallback format lama.
  const order =
    (await prisma.order.findUnique({
      where: { orderId: body.order_id ?? "" },
    }).catch(() => null)) ??
    (await (async () => {
      const legacyId = parseLegacyMidtransOrderId(body.order_id ?? "");
      return legacyId
        ? prisma.order.findUnique({ where: { id: legacyId } })
        : null;
    })());
  if (!order) {
    return NextResponse.json(
      { success: false, error: "Order not found" },
      { status: 404 },
    );
  }

  const nextStatus = mapMidtransStatus(
    body.transaction_status ?? "pending",
    body.fraud_status,
  );

  // Status final tidak ditimpa (webhook bisa datang berkali-kali).
  if (order.paymentStatus === "PENDING") {
    await applyPaymentTransition({
      orderId: order.id,
      from: "PENDING",
      to: nextStatus,
      data: {
        paymentMethod: body.payment_type ?? "qris",
        transactionId: body.transaction_id ?? null,
      },
    });
  }

  // Midtrans mengharapkan 200 tanpa body error.
  return NextResponse.json({ success: true });
}

/**
 * GET /api/web/orders/notification?order_id=TOURISM-xxx&status_code=200&transaction_status=settlement
 *
 * Menangani Finish/Redirect URL Midtrans (browser diarahkan ke sini setelah
 * menyelesaikan pembayaran). Query param TIDAK dipercaya langsung — status
 * selalu diverifikasi ulang ke API Midtrans memakai server key, lalu user
 * di-redirect ke halaman pembayaran /payment/{id}.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const midtransOrderId = url.searchParams.get("order_id") ?? "";

  const order = await resolveOrder(midtransOrderId);

  // Verifikasi otoritatif ke Midtrans (abaikan status di query param).
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
        await applyPaymentTransition({
          orderId: order.id,
          from: "PENDING",
          to: nextStatus,
          data: {
            paymentMethod: status.paymentType ?? "qris",
            transactionId: status.transactionId,
          },
        });
      }
    }
  }

  // Selalu arahkan user kembali ke halaman pembayaran order terkait.
  const target = order ? `/payment/${order.id}` : "/profile";
  return NextResponse.redirect(new URL(target, BASE_URL), 303);
}

/** Order dari order_id Midtrans: kode tersimpan dulu, lalu format lama. */
async function resolveOrder(midtransOrderId: string): Promise<Order | null> {
  if (!midtransOrderId) return null;
  const byCode = await prisma.order
    .findUnique({ where: { orderId: midtransOrderId } })
    .catch(() => null);
  if (byCode) return byCode;

  const legacyId = parseLegacyMidtransOrderId(midtransOrderId);
  return legacyId ? prisma.order.findUnique({ where: { id: legacyId } }) : null;
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
