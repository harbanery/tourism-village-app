import { NextResponse } from "next/server";
import prisma from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { REMOTE_TX_OPTIONS, withRetry } from "@/server/prismaRetry";
import { expireStalePendingOrders, paymentDeadline } from "@/server/orderExpiry";
import { customerFromUser, ensureOrderQris } from "@/server/qris";
import { onOrderCreated } from "@/server/orderEvents";
import {
  MAX_ORDERS_PER_DAY,
  countRecentOrders,
} from "@/services/orderService";

/**
 * GET /api/web/orders — riwayat pesanan milik user login
 * (termasuk status pembayaran).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  // Expire PENDING yang melewati batas waktu pembayaran.
  await expireStalePendingOrders();

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { dateOrder: "desc" },
    include: { items: { include: { package: true } } },
  });

  return NextResponse.json({
    success: true,
    data: orders.map((order) => ({
      id: order.id,
      dateOrder: order.dateOrder.toISOString(),
      dateSchedule: order.dateSchedule.toISOString(),
      homestay: order.homestay,
      homestayTime: order.homestayTime,
      totalPrice: order.totalPrice,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      paidAt: order.paidAt?.toISOString() ?? null,
      paymentExpiresAt: order.paymentExpiresAt?.toISOString() ?? null,
      items: order.items.map((item) => ({
        id: item.id,
        packageName: item.package.name,
        quantity: item.quantity,
        price: item.price,
        dateSchedule: item.dateSchedule?.toISOString() ?? null,
        homestay: item.homestay,
        homestayTime: item.homestayTime,
      })),
    })),
  });
}

interface CreateOrderItemInput {
  packageId: number;
  quantity: number;
  /** Jadwal per paket (ISO date) — setiap paket bisa berbeda jadwalnya. */
  dateSchedule?: string;
  homestay?: boolean;
  homestayTime?: number | null;
}

interface CreateOrderBody {
  items?: CreateOrderItemInput[];
}

/**
 * POST /api/web/orders — buat pesanan baru (wajib login).
 *
 * Harga TIDAK dipercaya dari klien: server mengambil harga terbaru dari
 * DB (paket ACTIVE), menghitung subtotal + total, lalu membuat charge QRIS
 * (Core API) untuk pembayaran di halaman /payment/[id].
 *
 * Jadwal (tanggal berangkat, menginap, jumlah hari) dikirim per item —
 * setiap paket bisa punya jadwal berbeda. Field level order disimpan
 * sebagai agregat (tanggal paling awal, ringkasan menginap).
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  let body: CreateOrderBody;
  try {
    body = (await request.json()) as CreateOrderBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  // --- Validasi input ---
  const cartItems = (body.items ?? []).filter(
    (item) => Number.isInteger(item.packageId) && item.quantity >= 1,
  );
  if (cartItems.length === 0) {
    return NextResponse.json(
      { success: false, error: "EMPTY_ITEMS" },
      { status: 400 },
    );
  }

  // Tanggal berangkat minimal H+2 (2 hari setelah hari ini).
  const minSchedule = new Date();
  minSchedule.setHours(0, 0, 0, 0);
  minSchedule.setDate(minSchedule.getDate() + 2);

  // Parse jadwal per item; netralkan zona waktu (@db.Date).
  const itemSchedules = cartItems.map((item) => {
    const schedule = item.dateSchedule ? new Date(item.dateSchedule) : null;
    if (!schedule || Number.isNaN(schedule.getTime())) {
      return { error: "INVALID_SCHEDULE" as const };
    }
    schedule.setHours(12, 0, 0, 0);
    if (schedule.getTime() < minSchedule.getTime()) {
      return { error: "SCHEDULE_TOO_SOON" as const };
    }
    const homestay = item.homestay === true;
    return {
      schedule,
      homestay,
      homestayTime: homestay ? Math.max(1, Number(item.homestayTime) || 1) : null,
    };
  });
  const invalid = itemSchedules.find((row) => "error" in row);
  if (invalid) {
    return NextResponse.json(
      { success: false, error: invalid.error },
      { status: 400 },
    );
  }

  // Rate limit: maksimal 5 order per 24 jam per user.
  const recentOrders = await countRecentOrders(user.id);
  if (recentOrders >= MAX_ORDERS_PER_DAY) {
    return NextResponse.json(
      { success: false, error: "ORDER_LIMIT_REACHED" },
      { status: 429 },
    );
  }

  try {
    // --- Ambil harga dari DB (server-trusted) ---
    const packageIds = [...new Set(cartItems.map((item) => item.packageId))];
    const packages = await prisma.package.findMany({
      where: { id: { in: packageIds }, status: "ACTIVE" },
      include: { place: { select: { status: true } } },
    });
    const activePackages = packages.filter(
      (pkg) => pkg.placeId === null || pkg.place?.status === "ACTIVE",
    );

    if (activePackages.length !== packageIds.length) {
      return NextResponse.json(
        { success: false, error: "PACKAGE_UNAVAILABLE" },
        { status: 400 },
      );
    }

    const priceById = new Map(activePackages.map((pkg) => [pkg.id, pkg]));

    const orderItems = cartItems.map((item, index) => {
      const pkg = priceById.get(item.packageId)!;
      const scheduleRow = itemSchedules[index] as {
        schedule: Date;
        homestay: boolean;
        homestayTime: number | null;
      };
      // Menginap → harga dikalikan jumlah hari (1 hari = tetap ×1);
      // tanpa menginap tidak dikalikan.
      const days = scheduleRow.homestay
        ? Math.max(1, scheduleRow.homestayTime ?? 1)
        : 1;
      return {
        packageId: pkg.id,
        name: pkg.name,
        price: pkg.price, // harga satuan saat transaksi
        quantity: item.quantity,
        days,
        subtotal: pkg.price * item.quantity * days,
        dateSchedule: scheduleRow.schedule,
        homestay: scheduleRow.homestay,
        homestayTime: scheduleRow.homestayTime,
      };
    });
    const totalPrice = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    // Agregat level order: tanggal paling awal + ringkasan menginap.
    const earliestSchedule = orderItems
      .map((item) => item.dateSchedule)
      .reduce((a, b) => (a.getTime() < b.getTime() ? a : b));
    const anyHomestay = orderItems.some((item) => item.homestay);
    const maxHomestayTime = anyHomestay
      ? Math.max(
          ...orderItems.map((item) => item.homestayTime ?? 1),
        )
      : null;

    // --- Simpan order + item (transaksi atomik) ---
    // REMOTE_TX_OPTIONS: DB remote (Railway) berlatensi tinggi dari lokal,
    // default timeout 5s memicu P2028. withRetry menangani transient error.
    const order = await withRetry(() =>
      prisma.$transaction(
        async (tx) => {
          const created = await tx.order.create({
            data: {
              userId: user.id,
              dateSchedule: earliestSchedule,
              homestay: anyHomestay,
              homestayTime: maxHomestayTime,
              totalPrice,
              paymentStatus: "PENDING",
              // Batas waktu pembayaran (custom_expiry charge QRIS mengikuti ini).
              paymentExpiresAt: paymentDeadline(),
              items: {
                create: orderItems.map((item) => ({
                  packageId: item.packageId,
                  quantity: item.quantity,
                  price: item.subtotal,
                  dateSchedule: item.dateSchedule,
                  homestay: item.homestay,
                  homestayTime: item.homestayTime,
                })),
              },
            },
            include: { items: { include: { package: true } } },
          });
          return created;
        },
        REMOTE_TX_OPTIONS,
      ),
    );

    // --- Buat QR pembayaran QRIS (bila Midtrans dikonfigurasi) ---
    // Pola QRIS POS integration: QR dirender di halaman /payment/[id],
    // tanpa snap.js dan tanpa redirect keluar.
    const qris = await ensureOrderQris({ order, customer: customerFromUser(user) });

    // Notifikasi + email konfirmasi pesanan (best-effort, tidak memblok respons).
    void onOrderCreated(order.id);

    return NextResponse.json(
      {
        success: true,
        data: {
          orderId: order.id,
          dateSchedule: order.dateSchedule.toISOString(),
          homestay: order.homestay,
          homestayTime: order.homestayTime,
          totalPrice,
          paymentStatus: "PENDING" as const,
          paymentExpiresAt:
            order.paymentExpiresAt?.toISOString() ?? null,
          items: orderItems.map((item) => ({
            packageId: item.packageId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
            dateSchedule: item.dateSchedule.toISOString(),
            homestay: item.homestay,
            homestayTime: item.homestayTime,
          })),
          payment: {
            /** null = QR belum tersedia (Midtrans tidak dikonfigurasi / gagal). */
            qris: qris
              ? { qrString: qris.qrString, qrImageUrl: qris.qrImageUrl }
              : null,
          },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
