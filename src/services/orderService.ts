import prisma from "@/server/db";
import { expireStalePendingOrders } from "@/server/orderExpiry";
import type { AuthUser } from "@prisma/client";

/**
 * Service layer untuk akses data order user web (pola progress-self:
 * service berinteraksi langsung dengan Prisma, dipanggil oleh server
 * component / route handler).
 */

/** Status pembayaran order (enum Prisma PaymentStatus). */
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELED";

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
  paymentStatus: PaymentStatus;
  paymentExpiresAt: string | null;
  items: {
    id: number;
    packageName: string;
    quantity: number;
    price: number;
    /** Jadwal per paket — null untuk data lama (fallback ke agregat order). */
    dateSchedule: string | null;
    homestay: boolean;
    homestayTime: number | null;
  }[];
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
 * Prioritas urutan riwayat pesanan: Menunggu Pembayaran (PENDING) paling
 * atas, disusul Lunas (PAID), baru sisa status. Dalam tiap grup: order
 * terbaru duluan, lalu tie-break tanggal reservasi paling awal duluan.
 */
const STATUS_SORT_PRIORITY: Record<string, number> = {
  PENDING: 0,
  PAID: 1,
  FAILED: 2,
  CANCELED: 3,
};

function compareOrders(
  a: { paymentStatus: string; dateOrder: Date; dateSchedule: Date },
  b: { paymentStatus: string; dateOrder: Date; dateSchedule: Date },
): number {
  const prio =
    (STATUS_SORT_PRIORITY[a.paymentStatus] ?? 9) -
    (STATUS_SORT_PRIORITY[b.paymentStatus] ?? 9);
  if (prio !== 0) return prio;
  const byDate = b.dateOrder.getTime() - a.dateOrder.getTime();
  if (byDate !== 0) return byDate;
  return a.dateSchedule.getTime() - b.dateSchedule.getTime();
}

/** Mode sorting riwayat (default = prioritas status, lihat compareOrders). */
export type OrdersSortMode = "default" | "newest" | "schedule";

function makeOrderComparator(sort: OrdersSortMode) {
  if (sort === "newest") {
    return (a: { dateOrder: Date }, b: { dateOrder: Date }) =>
      b.dateOrder.getTime() - a.dateOrder.getTime();
  }
  if (sort === "schedule") {
    return (
      a: { dateOrder: Date; dateSchedule: Date },
      b: { dateOrder: Date; dateSchedule: Date },
    ) =>
      a.dateSchedule.getTime() - b.dateSchedule.getTime() ||
      b.dateOrder.getTime() - a.dateOrder.getTime();
  }
  return compareOrders;
}

/** Hasil halaman riwayat order (infinite scroll). */
export interface UserOrdersPage {
  items: UserOrder[];
  total: number;
  hasMore: boolean;
}

/** Opsi halaman riwayat order. */
export interface UserOrdersPageOptions {
  take?: number;
  skip?: number;
  /** Filter status pembayaran (tanpa filter bila undefined). */
  status?: PaymentStatus;
  /** Mode sorting (default: PENDING → PAID → sisanya, terbaru duluan). */
  sort?: OrdersSortMode;
}

/**
 * Satu halaman riwayat order milik user (pola infinite scroll): urut
 * PENDING → PAID → sisanya; dalam tiap grup order terbaru duluan, lalu
 * tanggal reservasi paling awal duluan. Mode sorting lain (terbaru /
 * reservasi terdekat) serta filter status pembayaran dipakai untuk kontrol
 * sorting & filter di riwayat belanja. Query ringan (id + status +
 * tanggal) dipakai untuk sorting/pagination, lalu baris penuh + item
 * hanya diambil untuk halaman aktif.
 *
 * PENDING yang melewati batas waktu pembayaran di-expire menjadi CANCELED
 * dulu supaya status yang tampil selalu segar.
 */
export async function getUserOrdersPage(
  user: AuthUser,
  { take = 3, skip = 0, status, sort = "default" }: UserOrdersPageOptions = {},
): Promise<UserOrdersPage> {
  await expireStalePendingOrders();

  const safeTake = Math.min(Math.max(1, Math.floor(take)), 20);
  const safeSkip = Math.max(0, Math.floor(skip));

  const lightRows = await prisma.order.findMany({
    where: {
      userId: user.id,
      ...(status ? { paymentStatus: status } : {}),
    },
    select: {
      id: true,
      paymentStatus: true,
      dateOrder: true,
      dateSchedule: true,
    },
  });
  lightRows.sort(makeOrderComparator(sort));

  const total = lightRows.length;
  const pageIds = lightRows
    .slice(safeSkip, safeSkip + safeTake)
    .map((row) => row.id);

  if (pageIds.length === 0) {
    return { items: [], total, hasMore: safeSkip + safeTake < total };
  }

  const fullRows = await prisma.order.findMany({
    where: { id: { in: pageIds } },
    include: { items: { include: { package: true } } },
  });
  const byId = new Map(fullRows.map((row) => [row.id, row]));

  return {
    items: pageIds
      .map((id) => byId.get(id))
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .map((order) => toUserOrder(order, user)),
    total,
    hasMore: safeSkip + safeTake < total,
  };
}

/** Map baris Prisma → DTO UserOrder. */
function toUserOrder(
  order: {
    id: number;
    userId: number;
    dateOrder: Date;
    dateSchedule: Date;
    homestay: boolean;
    homestayTime: number | null;
    totalPrice: number;
    paymentStatus: PaymentStatus;
    paymentExpiresAt: Date | null;
    items: {
      id: number;
      quantity: number;
      price: number;
      dateSchedule: Date | null;
      homestay: boolean;
      homestayTime: number | null;
      package: { name: string };
    }[];
  },
  user: Pick<AuthUser, "name" | "email" | "phone">,
): UserOrder {
  return {
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
      dateSchedule: item.dateSchedule?.toISOString() ?? null,
      homestay: item.homestay,
      homestayTime: item.homestayTime,
    })),
  };
}

/**
 * Riwayat order milik user (PENDING → PAID → sisanya; terbaru duluan,
 * tie-break reservasi paling awal). PENDING yang melewati batas waktu
 * pembayaran di-expire menjadi CANCELED dulu supaya status yang tampil
 * selalu segar.
 */
export async function getUserOrders(user: AuthUser): Promise<UserOrder[]> {
  await expireStalePendingOrders();

  const orderRows = await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: { include: { package: true } } },
  });
  orderRows.sort(compareOrders);

  return orderRows.map((order) => toUserOrder(order, user));
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
      dateSchedule: item.dateSchedule?.toISOString() ?? null,
      homestay: item.homestay,
      homestayTime: item.homestayTime,
    })),
  };
}
