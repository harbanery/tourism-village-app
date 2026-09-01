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
      items: order.items.map((item) => ({
        id: item.id,
        packageName: item.package.name,
        quantity: item.quantity,
        price: item.price,
      })),
    })),
  });
}

interface CreateOrderBody {
  items?: { packageId: number; quantity: number }[];
  dateSchedule?: string;
  homestay?: boolean;
  homestayTime?: number | null;
}

/**
 * POST /api/web/orders — buat pesanan baru (wajib login).
 *
 * Harga TIDAK dipercaya dari klien: server mengambil harga terbaru dari
 * DB (paket ACTIVE), menghitung subtotal + total, lalu membuat transaksi
 * Midtrans Snap bila terkonfigurasi — selain itu kembali ke simulator.
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

  const schedule = body.dateSchedule ? new Date(body.dateSchedule) : null;
  if (!schedule || Number.isNaN(schedule.getTime())) {
    return NextResponse.json(
      { success: false, error: "INVALID_SCHEDULE" },
      { status: 400 },
    );
  }
  schedule.setHours(12, 0, 0, 0); // netralkan zona waktu (@db.Date)

  const homestay = body.homestay === true;
  const homestayTime = homestay ? Math.max(1, Number(body.homestayTime) || 1) : null;

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

    const orderItems = cartItems.map((item) => {
      const pkg = priceById.get(item.packageId)!;
      return {
        packageId: pkg.id,
        name: pkg.name,
        price: pkg.price, // harga satuan saat transaksi
        quantity: item.quantity,
        subtotal: pkg.price * item.quantity,
      };
    });
    const totalPrice = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    // --- Simpan order + item (transaksi atomik) ---
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId: user.id,
          dateSchedule: schedule,
          homestay,
          homestayTime,
          totalPrice,
          paymentStatus: "PENDING",
          items: {
            create: orderItems.map((item) => ({
              packageId: item.packageId,
              quantity: item.quantity,
              price: item.subtotal,
            })),
          },
        },
        include: { items: { include: { package: true } } },
      });
      return created;
    });

    // --- Buat transaksi Midtrans Snap (bila dikonfigurasi) ---
    const midtransOrderId = buildMidtransOrderId(order.id);
    const snap = await createSnapTransaction({
      midtransOrderId,
      grossAmount: totalPrice,
      items: orderItems.map((item) => ({
        id: String(item.packageId),
        price: item.price,
        quantity: item.quantity,
        name: item.name,
      })),
      customer: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });

    if (snap) {
      await prisma.order.update({
        where: { id: order.id },
        data: { snapToken: snap.token },
      });
    }

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
          items: orderItems.map((item) => ({
            packageId: item.packageId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
          })),
          payment: {
            /** true = bayar via simulator lokal (Midtrans belum dikonfigurasi). */
            simulator: !snap,
            snapToken: snap?.token ?? null,
            snapRedirectUrl: snap?.redirectUrl ?? null,
            snapScriptUrl: MIDTRANS_SNAP_SCRIPT_URL,
            clientKey: MIDTRANS_CLIENT_KEY,
            midtransConfigured: isMidtransConfigured(),
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
