import prisma from "@/server/db";
import { sendEmail } from "@/server/email";
import {
  dailySummaryEmail,
  orderCanceledEmail,
  orderConfirmationEmail,
  orderPaidEmail,
  tripReminderEmail,
  type OrderEmailData,
} from "@/server/emailTemplates";
import { NOTIFICATION_LOCALE } from "@/config/variables";
import { createUserNotification, notifyAdmins } from "@/services/notificationService";

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

/** Order + item + user untuk keperluan email/notifikasi. */
async function loadOrder(orderId: number) {
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
async function sendMasterAdminsEmail(
  content: { subject: string; text: string; html: string },
): Promise<void> {
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
export async function onOrderCreated(orderId: number): Promise<void> {
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
        ? `Pesanan #${order.id} dibuat`
        : `Order #${order.id} created`,
      body: isId
        ? `Total ${rupiah(order.totalPrice)}. Selesaikan pembayaran sebelum ${deadline}.`
        : `Total ${rupiah(order.totalPrice)}. Complete payment before ${deadline}.`,
      link: `/payment/${order.id}`,
    });
    sendUserEmail(order.user, orderConfirmationEmail(emailData));

    // Notifikasi + email ke admin (operasional).
    await notifyAdmins({
      type: "NEW_ORDER",
      title: isId ? `Pesanan baru #${order.id}` : `New order #${order.id}`,
      body: isId
        ? `${order.user.name} membuat pesanan senilai ${rupiah(order.totalPrice)}.`
        : `${order.user.name} placed an order worth ${rupiah(order.totalPrice)}.`,
      link: "/order",
    });
    await sendMasterAdminsEmail(orderConfirmationEmail(emailData));
  } catch (error) {
    console.error("[orderEvents] onOrderCreated:", error);
  }
}

/** Event: pembayaran diterima (status → PAID). */
export async function onOrderPaid(orderId: number): Promise<void> {
  try {
    const order = await loadOrder(orderId);
    if (!order) return;

    const emailData = toEmailData(order);

    await createUserNotification(order.user.id, {
      type: "ORDER_PAID",
      title: isId
        ? `Pembayaran pesanan #${order.id} berhasil`
        : `Payment for order #${order.id} received`,
      body: isId
        ? `Terima kasih! Pesanan Anda telah dibayar (${rupiah(order.totalPrice)}).`
        : `Thank you! Your order is paid (${rupiah(order.totalPrice)}).`,
      link: `/payment/${order.id}`,
    });
    sendUserEmail(order.user, orderPaidEmail(emailData));

    await notifyAdmins({
      type: "PAYMENT_RECEIVED",
      title: isId
        ? `Pembayaran diterima #${order.id}`
        : `Payment received #${order.id}`,
      body: isId
        ? `${order.user.name} membayar ${rupiah(order.totalPrice)}.`
        : `${order.user.name} paid ${rupiah(order.totalPrice)}.`,
      link: "/order",
    });
    await sendMasterAdminsEmail(orderPaidEmail(emailData));
  } catch (error) {
    console.error("[orderEvents] onOrderPaid:", error);
  }
}

/** Event: pesanan dibatalkan (kedaluwarsa / gagal pembayaran). */
export async function onOrderCanceled(orderId: number): Promise<void> {
  try {
    const order = await loadOrder(orderId);
    if (!order) return;

    await createUserNotification(order.user.id, {
      type: "ORDER_CANCELED",
      title: isId
        ? `Pesanan #${order.id} dibatalkan`
        : `Order #${order.id} canceled`,
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
      title: isId ? "Ulasan baru menunggu moderasi" : "New review awaiting moderation",
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
    const byOrder = new Map<number, typeof items>();
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
        where: { paymentStatus: "CANCELED", dateOrder: { gte: start, lt: end } },
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
