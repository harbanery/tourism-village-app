import { NextResponse } from "next/server";
import prisma from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import {
  MIDTRANS_CLIENT_KEY,
  MIDTRANS_SNAP_SCRIPT_URL,
} from "@/config/variables";
import {
  buildMidtransOrderId,
  createSnapTransaction,
  isMidtransConfigured,
} from "@/server/midtrans";
import { isPaymentExpired, paymentDeadline } from "@/server/orderExpiry";

/**
 * GET /api/web/orders/[id]/pay — lanjutkan pembayaran order PENDING.
 *
 * Dipakai halaman /payment/[id] dan tombol "Bayar" di riwayat profil:
 * mengembalikan opsi pembayaran (token Snap bila ada / simulator) untuk
 * order milik user login. Token Snap lama dipakai ulang bila masih tersimpan.
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

  // Kedaluwarsa? Expire menjadi CANCELED — tidak ada opsi pembayaran lagi.
  if (isPaymentExpired(order)) {
    const expired = await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "CANCELED" },
    });
    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        paymentStatus: expired.paymentStatus,
        expired: true,
        payment: null,
      },
    });
  }

  // Order final (PAID/FAILED/CANCELED) tidak punya opsi pembayaran.
  if (order.paymentStatus !== "PENDING") {
    return NextResponse.json({
      success: true,
      data: { orderId: order.id, paymentStatus: order.paymentStatus, payment: null },
    });
  }

  // Buat token Snap baru bila belum ada (order lama / simulator sebelumnya).
  let snapToken = order.snapToken;
  // URL redirect tersimpan ikut dipakai ulang (fallback bila snap.js gagal).
  let snapRedirectUrl = order.snapRedirectUrl ?? null;
  // Buat transaksi Snap baru bila token/redirect URL belum lengkap
  // (order baru tanpa snap, atau order lama sebelum kolom redirect URL ada).
  let effectiveExpiresAt = order.paymentExpiresAt;
  if (!snapToken || !snapRedirectUrl) {
    // item.price menyimpan SUBTOTAL; harga satuan = subtotal/qty.
    // Selisih pembulatan ditampung di item terakhir agar jumlahnya
    // persis sama dengan gross_amount (Midtrans menolak selisih).
    const snapItems = order.items.map((item) => ({
      id: String(item.packageId),
      price: Math.round(item.price / Math.max(1, item.quantity)),
      quantity: item.quantity,
      name: item.package.name,
    }));
    const snapItemsSum = snapItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    if (snapItems.length > 0) {
      const last = snapItems[snapItems.length - 1];
      last.price += Math.round((order.totalPrice - snapItemsSum) / last.quantity);
    }

    // Order lama tanpa deadline mendapat deadline baru saat resume.
    const expiresAt = order.paymentExpiresAt ?? paymentDeadline();
    effectiveExpiresAt = expiresAt;

    const snap = await createSnapTransaction({
      midtransOrderId: buildMidtransOrderId(order.id),
      grossAmount: order.totalPrice,
      items: snapItems,
      customer: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      expiryHours: Math.max(
        1,
        Math.ceil((expiresAt.getTime() - Date.now()) / (60 * 60 * 1000)),
      ),
    });
    if (snap) {
      snapToken = snap.token;
      snapRedirectUrl = snap.redirectUrl;
      await prisma.order.update({
        where: { id: order.id },
        data: {
          snapToken: snap.token,
          snapRedirectUrl: snap.redirectUrl,
          paymentExpiresAt: expiresAt,
        },
      });
    } else {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentExpiresAt: expiresAt },
      });
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      orderId: order.id,
      totalPrice: order.totalPrice,
      paymentStatus: order.paymentStatus,
      paymentExpiresAt: effectiveExpiresAt?.toISOString() ?? null,
      payment: {
        simulator: !snapToken,
        snapToken,
        snapRedirectUrl,
        snapScriptUrl: MIDTRANS_SNAP_SCRIPT_URL,
        clientKey: MIDTRANS_CLIENT_KEY,
        midtransConfigured: isMidtransConfigured(),
      },
    },
  });
}

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
  // Expire dulu bila sudah lewat batas waktu — order kedaluwarsa tidak
  // bisa dibayar lagi.
  if (isPaymentExpired(order)) {
    const expired = await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "CANCELED" },
    });
    return NextResponse.json({
      success: true,
      data: { paymentStatus: expired.paymentStatus, expired: true },
    });
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
