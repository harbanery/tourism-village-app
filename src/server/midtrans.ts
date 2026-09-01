import { createHash } from "node:crypto";
import {
  MIDTRANS_IS_CONFIGURED,
  MIDTRANS_SERVER_KEY,
  MIDTRANS_SNAP_API_URL,
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
 * order_id Midtrans yang stabil + unik per order: `TOURISM-{orderId}-{rand}`.
 * Bagian rand mencegah bentrok bila user membuat transaksi ulang.
 */
export function buildMidtransOrderId(orderId: number): string {
  return `TOURISM-${orderId}-${Date.now().toString(36)}`;
}

/** Ambil id order asli dari order_id Midtrans (TOURISM-{id}-...). */
export function parseMidtransOrderId(raw: string): number | null {
  const match = /^TOURISM-(\d+)-/.exec(raw);
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
