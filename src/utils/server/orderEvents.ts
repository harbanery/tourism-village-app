import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import {
  dailySummaryEmail,
  orderCanceledEmail,
  orderConfirmationEmail,
  orderPaidEmail,
  tripReminderEmail,
  weeklySummaryEmail,
  type OrderEmailData,
} from "@/utils/email/emailTemplates";
import { NOTIFICATION_LOCALE } from "@/utils/config/variables";
import {
  createUserNotification,
  notifyAdmins,
} from "@/services/notification";

/**
 * Event order → notifikasi in-app + email transaksional (pola progress-self).
 * Dipanggil dari: POST /api/web/orders (created), webhook Midtrans (paid/
 * canceled), sweep expiry, dan cron (pengingat jadwal, ringkasan harian).
 *
 * Semua pengiriman bersifat best-effort (fire-and-forget): kegagalan email/
 * notifikasi tidak boleh menggagalkan transaksi order.
 */

const isId = NOTIFICATION_LOCALE === "id";

function rupiah(value: number): string {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

/**
 * Label singkat order untuk teks notifikasi/email: id legacy ("25") apa
 * adanya, id UUID dipendekkan ke 8 karakter pertamanya.
 */
function orderLabel(order: { id: string }): string {
  return order.id.includes("-") ? order.id.slice(0, 8) : order.id;
}

/** Order + item + user untuk keperluan email/notifikasi. */
async function loadOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { package: { select: { name: true } } } },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          notifWeb: true,
          notifEmail: true,
        },
      },
    },
  });
}

type OrderWithRelations = NonNullable<Awaited<ReturnType<typeof loadOrder>>>;

function toEmailData(order: OrderWithRelations): OrderEmailData {
  return {
    orderId: order.id,
    userName: order.user.name,
    totalPrice: order.totalPrice,
    paymentExpiresAt: order.paymentExpiresAt,
    paidAt: order.paidAt,
    items: order.items.map((item) => ({
      packageName: item.package.name,
      quantity: item.quantity,
      price: item.price,
      dateSchedule: item.dateSchedule,
      homestay: item.homestay,
      homestayTime: item.homestayTime,
    })),
  };
}

/** Kirim email ke user hanya bila preferensi notifEmail aktif. */
function sendUserEmail(
  user: { email: string; notifEmail: boolean },
  content: { subject: string; text: string; html: string },
): void {
  if (!user.notifEmail) return;
  void sendEmail({ to: user.email, ...content });
}

/** Kirim email ke semua admin MASTER (notif operasional). */
async function sendMasterAdminsEmail(content: {
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const admins = await prisma.authAdmin.findMany({
    where: { status: "ACTIVE", role: "MASTER" },
    select: { email: true },
  });
  for (const admin of admins) {
    void sendEmail({ to: admin.email, ...content });
  }
}

/* --------------------------- Event lifecycle --------------------------- */

/** Event: pesanan baru dibuat (checkout sukses, status PENDING). */
export async function onOrderCreated(orderId: string): Promise<void> {
  try {
    const order = await loadOrder(orderId);
    if (!order) return;

    const emailData = toEmailData(order);
    const deadline = order.paymentExpiresAt
      ? new Intl.DateTimeFormat("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(order.paymentExpiresAt)
      : "";

    // Notifikasi + email ke user (menghormati preferensi).
    await createUserNotification(order.user.id, {
      type: "ORDER_CREATED",
      title: isId
        ? `Pesanan #${orderLabel(order)} dibuat`
        : `Order #${orderLabel(order)} created`,
      body: isId
        ? `Total ${rupiah(order.totalPrice)}. Selesaikan pembayaran sebelum ${deadline}.`
        : `Total ${rupiah(order.totalPrice)}. Complete payment before ${deadline}.`,
      link: `/payment/${order.id}`,
    });
    sendUserEmail(order.user, orderConfirmationEmail(emailData));

    // Notifikasi + email ke admin (operasional).
    await notifyAdmins({
      type: "NEW_ORDER",
      title: isId ? `Pesanan baru #${orderLabel(order)}` : `New order #${orderLabel(order)}`,
      body: isId
        ? `${order.user.name} membuat pesanan senilai ${rupiah(order.totalPrice)}.`
        : `${order.user.name} placed an order worth ${rupiah(order.totalPrice)}.`,
      link: "/admin/order",
    });
    await sendMasterAdminsEmail(orderConfirmationEmail(emailData));
  } catch (error) {
    console.error("[orderEvents] onOrderCreated:", error);
  }
}

/** Event: pembayaran diterima (status → PAID). */
export async function onOrderPaid(orderId: string): Promise<void> {
  try {
    const order = await loadOrder(orderId);
    if (!order) return;

    const emailData = toEmailData(order);

    await createUserNotification(order.user.id, {
      type: "ORDER_PAID",
      title: isId
        ? `Pembayaran pesanan #${orderLabel(order)} berhasil`
        : `Payment for order #${orderLabel(order)} received`,
      body: isId
        ? `Terima kasih! Pesanan Anda telah dibayar (${rupiah(order.totalPrice)}).`
        : `Thank you! Your order is paid (${rupiah(order.totalPrice)}).`,
      link: `/payment/${order.id}`,
    });
    sendUserEmail(order.user, orderPaidEmail(emailData));

    await notifyAdmins({
      type: "PAYMENT_RECEIVED",
      title: isId
        ? `Pembayaran diterima #${orderLabel(order)}`
        : `Payment received #${orderLabel(order)}`,
      body: isId
        ? `${order.user.name} membayar ${rupiah(order.totalPrice)}.`
        : `${order.user.name} paid ${rupiah(order.totalPrice)}.`,
      link: "/admin/order",
    });
    await sendMasterAdminsEmail(orderPaidEmail(emailData));
  } catch (error) {
    console.error("[orderEvents] onOrderPaid:", error);
  }
}

/** Event: pesanan dibatalkan (kedaluwarsa / gagal pembayaran). */
export async function onOrderCanceled(orderId: string): Promise<void> {
  try {
    const order = await loadOrder(orderId);
    if (!order) return;

    await createUserNotification(order.user.id, {
      type: "ORDER_CANCELED",
      title: isId
        ? `Pesanan #${orderLabel(order)} dibatalkan`
        : `Order #${orderLabel(order)} canceled`,
      body: isId
        ? "Pesanan dibatalkan karena melewati batas waktu pembayaran."
        : "The order was canceled because the payment deadline passed.",
      link: "/profile",
    });
    sendUserEmail(order.user, orderCanceledEmail(toEmailData(order)));
  } catch (error) {
    console.error("[orderEvents] onOrderCanceled:", error);
  }
}

/** Event: ulasan baru menunggu moderasi (dari POST /api/web/testimonials). */
export async function onReviewPending(
  userName: string,
  rating: number,
): Promise<void> {
  try {
    await notifyAdmins({
      type: "NEW_REVIEW",
      title: isId
        ? "Ulasan baru menunggu moderasi"
        : "New review awaiting moderation",
      body: isId
        ? `${userName} memberi rating ${rating}/5.`
        : `${userName} left a ${rating}/5 rating.`,
      link: "/review",
    });
  } catch (error) {
    console.error("[orderEvents] onReviewPending:", error);
  }
}

/* -------------------------------- Cron -------------------------------- */

/**
 * Cron harian: pengingat jadwal H-1 — semua item PAID yang berangkat
 * besok. Satu order bisa punya jadwal berbeda per paket, jadi pengingat
 * hanya memuat item yang jadwalnya besok.
 * Mengembalikan jumlah order yang dikirimi pengingat.
 */
export async function sendTripReminders(): Promise<number> {
  try {
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const items = await prisma.orderItem.findMany({
      where: {
        dateSchedule: { gte: tomorrow, lt: dayAfter },
        order: { paymentStatus: "PAID" },
      },
      include: {
        package: { select: { name: true } },
        order: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                notifWeb: true,
                notifEmail: true,
              },
            },
          },
        },
      },
    });

    // Kelompokkan per order agar user menerima satu pengingat gabungan.
    const byOrder = new Map<string, typeof items>();
    for (const item of items) {
      const list = byOrder.get(item.orderId) ?? [];
      list.push(item);
      byOrder.set(item.orderId, list);
    }

    for (const [orderId, orderItems] of byOrder) {
      const order = orderItems[0].order;
      const reminderItems = orderItems.map((item) => ({
        packageName: item.package.name,
        quantity: item.quantity,
        price: item.price,
        dateSchedule: item.dateSchedule,
        homestay: item.homestay,
        homestayTime: item.homestayTime,
      }));
      const packageNames = reminderItems
        .map((item) => item.packageName)
        .join(", ");

      await createUserNotification(order.user.id, {
        type: "TRIP_REMINDER",
        title: isId ? "Jadwal wisata besok" : "Your trip is tomorrow",
        body: isId
          ? `${packageNames} berangkat besok. Mohon hadir 15 menit lebih awal.`
          : `${packageNames} start tomorrow. Please arrive 15 minutes early.`,
        link: "/profile",
      });
      sendUserEmail(
        order.user,
        tripReminderEmail({
          orderId,
          userName: order.user.name,
          items: reminderItems,
        }),
      );
    }

    return byOrder.size;
  } catch (error) {
    console.error("[orderEvents] sendTripReminders:", error);
    return 0;
  }
}

/** Ringkasan transaksi satu hari (kalender lokal server). */
export async function buildDailySummary(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const [totalOrders, paidOrders, pendingOrders, canceledOrders, revenueAgg] =
    await Promise.all([
      prisma.order.count({ where: { dateOrder: { gte: start, lt: end } } }),
      prisma.order.count({
        where: { paymentStatus: "PAID", paidAt: { gte: start, lt: end } },
      }),
      prisma.order.count({
        where: { paymentStatus: "PENDING", dateOrder: { gte: start, lt: end } },
      }),
      prisma.order.count({
        where: {
          paymentStatus: "CANCELED",
          dateOrder: { gte: start, lt: end },
        },
      }),
      prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { paymentStatus: "PAID", paidAt: { gte: start, lt: end } },
      }),
    ]);

  return {
    date: start,
    totalOrders,
    paidOrders,
    pendingOrders,
    canceledOrders,
    revenue: revenueAgg._sum.totalPrice ?? 0,
  };
}

/**
 * Cron malam hari: ringkasan harian ke admin — email ke MASTER +
 * notifikasi in-app ke MASTER/VIEWER.
 */
export async function sendDailySummary(): Promise<void> {
  try {
    const summary = await buildDailySummary();

    await notifyAdmins({
      type: "DAILY_SUMMARY",
      title: isId ? "Ringkasan harian" : "Daily summary",
      body: isId
        ? `${summary.totalOrders} order baru, ${summary.paidOrders} dibayar, pendapatan ${rupiah(summary.revenue)}.`
        : `${summary.totalOrders} new orders, ${summary.paidOrders} paid, revenue ${rupiah(summary.revenue)}.`,
      link: "/",
    });
    await sendMasterAdminsEmail(dailySummaryEmail(summary));
  } catch (error) {
    console.error("[orderEvents] sendDailySummary:", error);
  }
}

/** Awal minggu (Senin 00:00) dari tanggal mana pun (kalender lokal). */
function weekStart(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // Senin=0 … Minggu=6
  d.setDate(d.getDate() - day);
  return d;
}

/** Agregat satu periode [start, end) — dipakai ringkasan mingguan. */
async function aggregatePeriod(start: Date, end: Date) {
  const [totalOrders, paidOrders, pendingOrders, canceledOrders, revenueAgg, buyers, paidRows, items] =
    await Promise.all([
      prisma.order.count({ where: { dateOrder: { gte: start, lt: end } } }),
      prisma.order.count({
        where: { paymentStatus: "PAID", paidAt: { gte: start, lt: end } },
      }),
      prisma.order.count({
        where: { paymentStatus: "PENDING", dateOrder: { gte: start, lt: end } },
      }),
      prisma.order.count({
        where: { paymentStatus: "CANCELED", dateOrder: { gte: start, lt: end } },
      }),
      prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { paymentStatus: "PAID", paidAt: { gte: start, lt: end } },
      }),
      prisma.order.groupBy({
        by: ["userId"],
        where: { dateOrder: { gte: start, lt: end } },
      }),
      prisma.order.findMany({
        where: { paymentStatus: "PAID", paidAt: { gte: start, lt: end } },
        select: { paidAt: true, totalPrice: true },
      }),
      prisma.orderItem.findMany({
        where: {
          order: { paymentStatus: "PAID", paidAt: { gte: start, lt: end } },
        },
        select: {
          quantity: true,
          price: true,
          package: { select: { name: true } },
        },
      }),
    ]);

  // Pendapatan per hari (bucket lokal Senin→Minggu).
  const revenuePerDay: { date: Date; revenue: number; paidOrders: number }[] =
    [];
  for (let i = 0; i < 7; i++) {
    const dayStart = new Date(start);
    dayStart.setDate(dayStart.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const dayPaid = paidRows.filter(
      (o) => o.paidAt! >= dayStart && o.paidAt! < dayEnd,
    );
    revenuePerDay.push({
      date: dayStart,
      revenue: dayPaid.reduce((sum, o) => sum + o.totalPrice, 0),
      paidOrders: dayPaid.length,
    });
  }

  // Paket terlaris (PAID) — qty & pendapatan per nama paket.
  const byPackage = new Map<string, { quantity: number; revenue: number }>();
  for (const item of items) {
    const agg = byPackage.get(item.package.name) ?? {
      quantity: 0,
      revenue: 0,
    };
    agg.quantity += item.quantity;
    agg.revenue += item.price;
    byPackage.set(item.package.name, agg);
  }
  const topPackages = [...byPackage.entries()]
    .map(([name, agg]) => ({ name, ...agg }))
    .sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity)
    .slice(0, 5);

  return {
    totalOrders,
    paidOrders,
    pendingOrders,
    canceledOrders,
    revenue: revenueAgg._sum.totalPrice ?? 0,
    newBuyers: buyers.length,
    revenuePerDay,
    topPackages,
  };
}

/**
 * Ringkasan tren minggu lalu (Senin–Minggu lengkap) + pembanding minggu
 * sebelumnya — bahan email/notifikasi `sendWeeklySummary`.
 */
export async function buildWeeklySummary() {
  const thisWeekStart = weekStart();
  const end = thisWeekStart; // akhir Minggu lalu
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  const prevEnd = start;
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - 7);

  const [current, prev] = await Promise.all([
    aggregatePeriod(start, end),
    aggregatePeriod(prevStart, prevEnd),
  ]);

  return {
    startDate: start,
    endDate: end,
    ...current,
    prev: {
      totalOrders: prev.totalOrders,
      paidOrders: prev.paidOrders,
      revenue: prev.revenue,
    },
  };
}

/**
 * Cron mingguan (menumpang daily-summary tiap Senin, atau endpoint
 * /api/cron/weekly-summary bila dijadwalkan terpisah): ringkasan TREN ke
 * admin — delta vs minggu lalu, pendapatan harian, paket terlaris.
 */
export async function sendWeeklySummary(): Promise<void> {
  try {
    const summary = await buildWeeklySummary();
    const revenueDelta =
      summary.prev.revenue === 0
        ? summary.revenue > 0
          ? isId
            ? "baru"
            : "new"
          : "—"
        : `${summary.revenue >= summary.prev.revenue ? "▲" : "▼"} ${Math.abs(
            Math.round(
              ((summary.revenue - summary.prev.revenue) / summary.prev.revenue) *
                100,
            ),
          )}%`;

    await notifyAdmins({
      type: "WEEKLY_SUMMARY",
      title: isId ? "Ringkasan mingguan" : "Weekly summary",
      body: isId
        ? `${summary.paidOrders} order dibayar, pendapatan ${rupiah(summary.revenue)} (${revenueDelta} vs minggu lalu).`
        : `${summary.paidOrders} paid orders, revenue ${rupiah(summary.revenue)} (${revenueDelta} vs last week).`,
      link: "/",
    });
    await sendMasterAdminsEmail(weeklySummaryEmail(summary));
  } catch (error) {
    console.error("[orderEvents] sendWeeklySummary:", error);
  }
}
