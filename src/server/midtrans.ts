import { createHash } from "node:crypto";
import {
  MIDTRANS_IS_CONFIGURED,
  MIDTRANS_SERVER_KEY,
  MIDTRANS_SNAP_API_URL,
  MIDTRANS_STATUS_API_URL,
} from "@/config/variables";

/**
 * Integrasi Midtrans Snap (sandbox/production) di sisi server.
 * Bila MIDTRANS_SERVER_KEY kosong, caller memakai mode simulator lokal
 * sehingga alur transaksi tetap bisa diuji tanpa kredensial.
 */

export interface SnapItemDetail {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

export interface SnapCustomerDetail {
  name: string;
  email: string;
  phone?: string | null;
}

export interface SnapTransactionResult {
  token: string;
  redirectUrl: string;
}

/** Midtrans aktif (server key terisi)? */
export function isMidtransConfigured(): boolean {
  return MIDTRANS_IS_CONFIGURED;
}

/**
 * order_id Midtrans yang deterministik per order: `TOURISM-{orderId}`.
 * Deterministik agar status transaksi bisa di-query ulang dari API Midtrans
 * (GET /v2/{order_id}/status) tanpa menyimpan id acak tambahan.
 */
export function buildMidtransOrderId(orderId: number): string {
  return `TOURISM-${orderId}`;
}

/** Ambil id order asli dari order_id Midtrans (TOURISM-{id}[-suffix]). */
export function parseMidtransOrderId(raw: string): number | null {
  const match = /^TOURISM-(\d+)/.exec(raw);
  return match ? Number(match[1]) : null;
}

/**
 * Buat transaksi Snap via API Midtrans.
 * Mengembalikan null bila Midtrans tidak dikonfigurasi / gagal —
 * caller wajib fallback ke simulator.
 */
export async function createSnapTransaction(params: {
  midtransOrderId: string;
  grossAmount: number;
  items: SnapItemDetail[];
  customer: SnapCustomerDetail;
  /** Batas waktu pembayaran (jam) — dikirim sebagai custom expiry Snap. */
  expiryHours?: number;
}): Promise<SnapTransactionResult | null> {
  if (!isMidtransConfigured()) return null;

  const auth = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64");
  try {
    const response = await fetch(MIDTRANS_SNAP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: params.midtransOrderId,
          gross_amount: params.grossAmount,
        },
        item_details: params.items,
        customer_details: {
          first_name: params.customer.name,
          email: params.customer.email,
          ...(params.customer.phone ? { phone: params.customer.phone } : {}),
        },
        ...(params.expiryHours
          ? { expiry: { unit: "hour", duration: params.expiryHours } }
          : {}),
      }),
    });

    if (!response.ok) {
      console.error(
        "Midtrans snap error:",
        response.status,
        await response.text(),
      );
      return null;
    }

    const json = (await response.json()) as {
      token?: string;
      redirect_url?: string;
    };
    if (!json.token) return null;
    return {
      token: json.token,
      redirectUrl: json.redirect_url ?? "",
    };
  } catch (error) {
    console.error("Midtrans snap request failed:", error);
    return null;
  }
}

/**
 * Verifikasi signature notification Midtrans:
 * sha512(order_id + status_code + gross_amount + serverKey).
 */
export function verifyMidtransSignature(params: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
}): boolean {
  if (!isMidtransConfigured()) return false;
  const expected = createHash("sha512")
    .update(`${params.orderId}${params.statusCode}${params.grossAmount}${MIDTRANS_SERVER_KEY}`)
    .digest("hex");
  return expected === params.signatureKey;
}

/** Mapping transaction_status Midtrans → PaymentStatus aplikasi. */
export function mapMidtransStatus(
  transactionStatus: string,
  fraudStatus?: string,
): "PENDING" | "PAID" | "FAILED" | "CANCELED" {
  switch (transactionStatus) {
    case "settlement":
    case "capture":
      return fraudStatus === "challenge" ? "PENDING" : "PAID";
    case "pending":
      return "PENDING";
    case "deny":
    case "failure":
      return "FAILED";
    case "cancel":
    case "expire":
      return "CANCELED";
    default:
      return "PENDING";
  }
}

export interface MidtransTransactionStatus {
  /** order_id Midtrans (TOURISM-{id}-{rand}). */
  orderId: string;
  transactionStatus: string;
  fraudStatus?: string;
  paymentType?: string;
  statusCode: string;
}

/**
 * Ambil status transaksi langsung dari API Midtrans (GET /v2/{order_id}/status).
 *
 * Dipakai untuk memverifikasi status secara otoritatif: query param redirect
 * finish (browser) TIDAK dipercaya — status final selalu dikonfirmasi
 * ke server Midtrans memakai server key.
 * Mengembalikan null bila Midtrans tidak dikonfigurasi / gagal.
 */
export async function fetchMidtransStatus(
  midtransOrderId: string,
): Promise<MidtransTransactionStatus | null> {
  if (!isMidtransConfigured()) return null;

  const auth = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64");
  try {
    const response = await fetch(
      `${MIDTRANS_STATUS_API_URL}/${encodeURIComponent(midtransOrderId)}/status`,
      {
        headers: { Accept: "application/json", Authorization: `Basic ${auth}` },
        cache: "no-store",
      },
    );
    if (!response.ok) {
      // 404 = order_id belum dikenal Midtrans (transaksi belum dibuat).
      if (response.status !== 404) {
        console.error(
          "Midtrans status error:",
          response.status,
          await response.text(),
        );
      }
      return null;
    }
    const json = (await response.json()) as {
      order_id?: string;
      transaction_status?: string;
      fraud_status?: string;
      payment_type?: string;
      status_code?: string;
    };
    if (!json.order_id || !json.transaction_status) return null;
    return {
      orderId: json.order_id,
      transactionStatus: json.transaction_status,
      fraudStatus: json.fraud_status,
      paymentType: json.payment_type,
      statusCode: json.status_code ?? "200",
    };
  } catch (error) {
    console.error("Midtrans status request failed:", error);
    return null;
  }
}
