import prisma from "@/server/db";
import { expireStalePendingOrders } from "@/server/orderExpiry";
import type { AuthUser } from "@prisma/client";

/**
 * Service layer untuk akses data order user web (pola progress-self:
 * service berinteraksi langsung dengan Prisma, dipanggil oleh server
 * component / route handler).
 */

/** DTO order + item untuk riwayat & pembayaran. */
export interface UserOrder {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  dateOrder: string;
  dateSchedule: string;
  homestay: "yes" | "no";
  homestayTime: number | null;
  totalPrice: number;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "CANCELED";
  paymentExpiresAt: string | null;
  items: { id: number; packageName: string; quantity: number; price: number }[];
}

/**
 * Rate limit pembuatan order: maksimal 5 order per 24 jam per user.
 * Semua order (termasuk yang lalu dibatalkan) dihitung supaya user tidak
 * bisa mem-bypass limit dengan membatalkan order.
 */
export const MAX_ORDERS_PER_DAY = 5;

export async function countRecentOrders(userId: number): Promise<number> {
  return prisma.order.count({
    where: {
      userId,
      dateOrder: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
}

/** Error rate limit order — dipetakan ke pesan terjemahan di klien. */
export class OrderLimitError extends Error {}

/**
 * Riwayat order milik user (terbaru dululu). PENDING yang melewati batas
 * waktu pembayaran di-expire menjadi CANCELED dulu supaya status yang
 * tampil selalu segar.
 */
export async function getUserOrders(user: AuthUser): Promise<UserOrder[]> {
  await expireStalePendingOrders();

  const orderRows = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { dateOrder: "desc" },
    include: { items: { include: { package: true } } },
  });

  return orderRows.map((order) => ({
    id: order.id,
    userId: order.userId,
    userName: user.name,
    userEmail: user.email,
    userPhone: user.phone ?? null,
    dateOrder: order.dateOrder.toISOString(),
    dateSchedule: order.dateSchedule.toISOString(),
    homestay: order.homestay ? ("yes" as const) : ("no" as const),
    homestayTime: order.homestayTime,
    totalPrice: order.totalPrice,
    paymentStatus: order.paymentStatus,
    paymentExpiresAt: order.paymentExpiresAt?.toISOString() ?? null,
    items: order.items.map((item) => ({
      id: item.id,
      packageName: item.package.name,
      quantity: item.quantity,
      price: item.price,
    })),
  }));
}

/**
 * Satu order milik user (untuk halaman pembayaran) — null bila tidak
 * ada / bukan milik user sesi.
 */
export async function getOrderForUser(
  orderId: number,
  userId: number,
): Promise<UserOrder | null> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: { include: { package: true } } },
  });
  if (!order) return null;

  const user = await prisma.authUser.findUnique({
    where: { id: userId },
    select: { name: true, email: true, phone: true },
  });

  return {
    id: order.id,
    userId: order.userId,
    userName: user?.name ?? "",
    userEmail: user?.email ?? "",
    userPhone: user?.phone ?? null,
    dateOrder: order.dateOrder.toISOString(),
    dateSchedule: order.dateSchedule.toISOString(),
    homestay: order.homestay ? ("yes" as const) : ("no" as const),
    homestayTime: order.homestayTime,
    totalPrice: order.totalPrice,
    paymentStatus: order.paymentStatus,
    paymentExpiresAt: order.paymentExpiresAt?.toISOString() ?? null,
    items: order.items.map((item) => ({
      id: item.id,
      packageName: item.package.name,
      quantity: item.quantity,
      price: item.price,
    })),
  };
}
