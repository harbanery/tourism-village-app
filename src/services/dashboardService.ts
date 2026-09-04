import prisma from "@/server/db";
import { isPaymentExpired } from "@/server/orderExpiry";

/**
 * Service statistik dashboard admin (pola services — dipanggil route
 * /api/admin/dashboard). Fokus monitoring transaksi pemesanan:
 * KPI pendapatan/order/AOV/sukses bayar, tren harian, distribusi status,
 * paket terlaris, rasio menginap, dan pembeli baru vs kembali.
 *
 * Agregasi dilakukan di JS dari row order periode (volume order situs
 * desa wisata kecil — lebih sederhana & aman daripada SQL date_trunc
 * lintas schema).
 */

export type DashboardPeriod = 7 | 30 | 90;

export interface DashboardAnalytics {
  period: DashboardPeriod;
  kpi: {
    /** Pendapatan total (semua waktu, PAID). */
    revenueTotal: number;
    revenueThisMonth: number;
    revenueLastMonth: number;
    /** Persentase perubahan pendapatan bulan ini vs bulan lalu (null bila tak ada pembanding). */
    revenueDeltaPct: number | null;
    ordersThisMonth: number;
    ordersLastMonth: number;
    ordersDeltaPct: number | null;
    /** Nilai rata-rata order (semua waktu, PAID). */
    aov: number;
    /** Order PAID (semua waktu). */
    paidTotal: number;
    /** PAID / seluruh order (semua waktu, persen). */
    successRate: number;
    /** PENDING yang masih dalam batas waktu (aktif menunggu bayar). */
    pendingActive: number;
    canceledTotal: number;
  };
  /** Tren harian periode: pendapatan (PAID per hari bayar) + jumlah order. */
  timeseries: { day: string; revenue: number; orders: number }[];
  /** Order per hari dipecah per status akhir (untuk stacked column). */
  statusSeries: { day: string; status: string; count: number }[];
  /** Komposisi status seluruh periode (donut). */
  statusTotals: { status: string; count: number }[];
  /** Paket terlaris periode (PAID): quantity + pendapatan. */
  topPackages: { name: string; quantity: number; revenue: number }[];
  /** Rasio item menginap vs tidak (PAID, periode). */
  homestay: { type: "stay" | "day"; value: number }[];
  /** Pembeli periode (PAID): baru vs kembali. */
  buyers: { type: "new" | "returning"; value: number }[];
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function monthStart(offset = 0): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() + offset);
  return d;
}

/** Persentase perubahan a→b (null bila pembanding 0). */
function deltaPct(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Statistik dashboard untuk periode (hari). */
export async function getDashboardAnalytics(
  period: DashboardPeriod = 30,
): Promise<DashboardAnalytics> {
  const periodStart = startOfDay(new Date());
  periodStart.setDate(periodStart.getDate() - (period - 1));

  const [
    orderCountTotal,
    paidAgg,
    thisMonthAgg,
    lastMonthAgg,
    thisMonthCount,
    lastMonthCount,
    canceledTotal,
    periodOrders,
    firstPaidByUser,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      _count: { _all: true },
      _sum: { totalPrice: true },
      where: { paymentStatus: "PAID" },
    }),
    prisma.order.aggregate({
      _sum: { totalPrice: true },
      where: { paymentStatus: "PAID", paidAt: { gte: monthStart(0) } },
    }),
    prisma.order.aggregate({
      _sum: { totalPrice: true },
      where: {
        paymentStatus: "PAID",
        paidAt: { gte: monthStart(-1), lt: monthStart(0) },
      },
    }),
    prisma.order.count({ where: { dateOrder: { gte: monthStart(0) } } }),
    prisma.order.count({
      where: { dateOrder: { gte: monthStart(-1), lt: monthStart(0) } },
    }),
    prisma.order.count({ where: { paymentStatus: "CANCELED" } }),
    // Order periode + item (untuk tren, distribusi, paket, menginap).
    prisma.order.findMany({
      where: { dateOrder: { gte: periodStart } },
      select: {
        userId: true,
        dateOrder: true,
        totalPrice: true,
        paymentStatus: true,
        paidAt: true,
        paymentExpiresAt: true,
        items: {
          select: {
            quantity: true,
            price: true,
            homestay: true,
            package: { select: { name: true } },
          },
        },
      },
    }),
    // PAID pertama setiap user (untuk pembeli baru vs kembali).
    prisma.order.findMany({
      where: { paymentStatus: "PAID" },
      select: { userId: true, paidAt: true },
      orderBy: { paidAt: "asc" },
    }),
  ]);

  const revenueTotal = paidAgg._sum.totalPrice ?? 0;
  const paidTotal = paidAgg._count._all;
  const revenueThisMonth = thisMonthAgg._sum.totalPrice ?? 0;
  const revenueLastMonth = lastMonthAgg._sum.totalPrice ?? 0;

  // Kerangka hari periode (isi nol agar grafik tidak bolong).
  const dayKeys: string[] = [];
  for (let i = 0; i < period; i++) {
    const day = new Date(periodStart);
    day.setDate(day.getDate() + i);
    dayKeys.push(dayKey(day));
  }
  const revenueByDay = new Map<string, number>(dayKeys.map((k) => [k, 0]));
  const ordersByDay = new Map<string, number>(dayKeys.map((k) => [k, 0]));
  const statusByDay = new Map<string, Record<string, number>>();

  for (const order of periodOrders) {
    const orderDay = dayKey(order.dateOrder);
    if (ordersByDay.has(orderDay)) {
      ordersByDay.set(orderDay, (ordersByDay.get(orderDay) ?? 0) + 1);
      const row = (statusByDay.get(orderDay) ?? {});
      row[order.paymentStatus] = (row[order.paymentStatus] ?? 0) + 1;
      statusByDay.set(orderDay, row);
    }
    // Pendapatan dicatat pada hari uang diterima (paidAt).
    if (order.paymentStatus === "PAID" && order.paidAt) {
      const paidDay = dayKey(order.paidAt);
      if (revenueByDay.has(paidDay)) {
        revenueByDay.set(paidDay, (revenueByDay.get(paidDay) ?? 0) + order.totalPrice);
      }
    }
  }

  const statusOrder = ["PAID", "PENDING", "FAILED", "CANCELED"] as const;
  const statusSeries: DashboardAnalytics["statusSeries"] = [];
  for (const day of dayKeys) {
    const row = statusByDay.get(day) ?? {};
    for (const status of statusOrder) {
      statusSeries.push({ day, status, count: row[status] ?? 0 });
    }
  }

  const statusTotalsMap = new Map<string, number>();
  for (const order of periodOrders) {
    statusTotalsMap.set(
      order.paymentStatus,
      (statusTotalsMap.get(order.paymentStatus) ?? 0) + 1,
    );
  }
  const statusTotals = statusOrder
    .filter((status) => statusTotalsMap.has(status))
    .map((status) => ({ status, count: statusTotalsMap.get(status)! }));

  // Paket terlaris + rasio menginap (hanya PAID — transaksi nyata).
  const packageAgg = new Map<string, { quantity: number; revenue: number }>();
  let stayQty = 0;
  let dayQty = 0;
  for (const order of periodOrders) {
    if (order.paymentStatus !== "PAID") continue;
    for (const item of order.items) {
      const row = packageAgg.get(item.package.name) ?? {
        quantity: 0,
        revenue: 0,
      };
      row.quantity += item.quantity;
      row.revenue += item.price;
      packageAgg.set(item.package.name, row);
      if (item.homestay) stayQty += item.quantity;
      else dayQty += item.quantity;
    }
  }
  const topPackages = [...packageAgg.entries()]
    .map(([name, row]) => ({ name, ...row }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Pembeli periode: user dengan order PAID di periode, dibagi menjadi
  // baru (PAID pertamanya ada di dalam periode) vs kembali.
  const firstPaid = new Map<string, Date>();
  for (const order of firstPaidByUser) {
    const userId = String(order.userId);
    const existing = firstPaid.get(userId);
    if (!existing && order.paidAt) firstPaid.set(userId, order.paidAt);
  }
  let newBuyers = 0;
  let returningBuyers = 0;
  const periodPaidUsers = new Set<string>();
  for (const order of periodOrders) {
    if (order.paymentStatus === "PAID") {
      periodPaidUsers.add(String(order.userId));
    }
  }
  for (const userId of periodPaidUsers) {
    const first = firstPaid.get(userId);
    if (first && first.getTime() >= periodStart.getTime()) newBuyers++;
    else returningBuyers++;
  }

  const pendingActive = periodOrders.filter(
    (order) =>
      order.paymentStatus === "PENDING" &&
      !isPaymentExpired({
        paymentStatus: order.paymentStatus,
        paymentExpiresAt: order.paymentExpiresAt,
      }),
  ).length;

  return {
    period,
    kpi: {
      revenueTotal,
      revenueThisMonth,
      revenueLastMonth,
      revenueDeltaPct: deltaPct(revenueThisMonth, revenueLastMonth),
      ordersThisMonth: thisMonthCount,
      ordersLastMonth: lastMonthCount,
      ordersDeltaPct: deltaPct(thisMonthCount, lastMonthCount),
      aov: paidTotal > 0 ? Math.round(revenueTotal / paidTotal) : 0,
      paidTotal,
      successRate:
        orderCountTotal > 0
          ? Math.round((paidTotal / orderCountTotal) * 100)
          : 0,
      pendingActive,
      canceledTotal,
    },
    timeseries: dayKeys.map((day) => ({
      day,
      revenue: revenueByDay.get(day) ?? 0,
      orders: ordersByDay.get(day) ?? 0,
    })),
    statusSeries,
    statusTotals,
    topPackages,
    homestay: [
      { type: "stay", value: stayQty },
      { type: "day", value: dayQty },
    ],
    buyers: [
      { type: "new", value: newBuyers },
      { type: "returning", value: returningBuyers },
    ],
  };
}
