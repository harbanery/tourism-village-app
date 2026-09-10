import { NextResponse } from "next/server";
import prisma, { REMOTE_TX_OPTIONS, withRetry } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { paymentDeadline } from "@/utils/server/orderExpiry";
import { buildOrderCode } from "@/lib/midtrans";
import { customerFromUser, ensureOrderQris } from "@/lib/qris";
import { onOrderCreated } from "@/utils/server/orderEvents";
import {
  MAX_ORDERS_PER_DAY,
  countRecentOrders,
  getUserOrdersPage,
  type OrdersSortMode,
  type PaymentStatus,
} from "@/services/order";

/** Status pembayaran yang bisa difilter di riwayat. */
const STATUS_FILTERS: PaymentStatus[] = [
  "PENDING",
  "PAID",
  "FAILED",
  "CANCELED",
];

/** Mode sorting riwayat yang dikenali. */
const SORT_MODES: OrdersSortMode[] = ["default", "newest", "schedule"];

/** Window guard order duplikat: submit ganda dalam 2 menit (rekom 2.3). */
const DUPLICATE_WINDOW_MS = 2 * 60 * 1000;

/**
 * Sidik jari keranjang: gabungan (paket, qty, jadwal, menginap) yang
 * diurutkan — dipakai mendeteksi submit ganda dengan isi identik.
 */
function cartFingerprint(
  items: {
    packageId: string;
    quantity: number;
    dateSchedule: Date | string | null;
    homestay: boolean;
    homestayTime: number | null;
  }[],
): string {
  return items
    .map((item) => {
      // Item tanpa jadwal (legacy) diberi penanda khusus "none".
      const day =
        item.dateSchedule === null
          ? "none"
          : new Date(item.dateSchedule).toISOString().slice(0, 10);
      return [
        item.packageId,
        item.quantity,
        day,
        item.homestay ? 1 : 0,
        item.homestayTime ?? 0,
      ].join(":");
    })
    .sort()
    .join("|");
}

/**
 * GET /api/web/orders?take=&skip=&status=&sort=&q= — satu halaman riwayat
 * pesanan milik user login untuk infinite scroll. Urutan default: PENDING
 * paling atas, disusul PAID, lalu sisanya — dalam tiap grup terbaru
 * duluan, tie-break tanggal reservasi paling awal. `status` memfilter
 * status pembayaran; `sort` mengganti mode urutan (newest = terbaru,
 * schedule = reservasi terdekat); `q` mencari order id (contains).
 * Respons: { items, total, hasMore }.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const take = Number(url.searchParams.get("take")) || 3;
  const skip = Number(url.searchParams.get("skip")) || 0;

  const rawStatus = url.searchParams.get("status") ?? "";
  const status = STATUS_FILTERS.includes(rawStatus as PaymentStatus)
    ? (rawStatus as PaymentStatus)
    : undefined;

  const rawSort = url.searchParams.get("sort") ?? "";
  const sort = SORT_MODES.includes(rawSort as OrdersSortMode)
    ? (rawSort as OrdersSortMode)
    : undefined;

  const rawQuery = url.searchParams.get("q") ?? "";

  const page = await getUserOrdersPage(user, {
    take,
    skip,
    status,
    sort,
    query: rawQuery,
  });

  return NextResponse.json({
    success: true,
    data: {
      items: page.items.map((order) => ({
        id: order.id,
        orderId: order.orderId,
        dateOrder: order.dateOrder,
        dateSchedule: order.dateSchedule,
        homestay: order.homestay === "yes",
        homestayTime: order.homestayTime,
        totalPrice: order.totalPrice,
        paymentStatus: order.paymentStatus,
        paymentMethod: null,
        paidAt: null,
        paymentExpiresAt: order.paymentExpiresAt,
        items: order.items,
      })),
      total: page.total,
      hasMore: page.hasMore,
    },
  });
}

interface CreateOrderItemInput {
  packageId: string;
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
    (item) =>
      typeof item.packageId === "string" &&
      item.packageId.length > 0 &&
      item.quantity >= 1,
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

  // Guard order duplikat (rekom 2.3): double-click / retry submit dengan
  // isi keranjang identik dalam window singkat → arahkan ke order yang
  // sudah ada, jangan buat order baru.
  const latest = await prisma.order.findFirst({
    where: {
      userId: user.id,
      dateOrder: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
    },
    orderBy: { dateOrder: "desc" },
    include: { items: true },
  });
  if (
    latest &&
    cartFingerprint(
      cartItems.map((item, index) => {
        const row = itemSchedules[index] as {
          schedule: Date;
          homestay: boolean;
          homestayTime: number | null;
        };
        return {
          packageId: item.packageId,
          quantity: item.quantity,
          dateSchedule: row.schedule,
          homestay: row.homestay,
          homestayTime: row.homestayTime,
        };
      }),
    ) === cartFingerprint(latest.items)
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "DUPLICATE_ORDER",
        orderId: latest.id,
      },
      { status: 409 },
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
              // order_id Midtrans (TOURISM-{uuid}{YYYYMMDD}) dibuat sekali
              // di sini dan dipakai charge QRIS + webhook/status.
              orderId: buildOrderCode(),
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
