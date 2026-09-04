import prisma from "@/server/db";

/**
 * Service notifikasi in-app (pola progress-self): tabel Notification untuk
 * user web + AdminNotification untuk panel admin. Dikonsumsi oleh
 * server/orderEvents (event order), cron, dan API bell icon.
 */

export type UserNotificationType =
  | "ORDER_CREATED"
  | "ORDER_PAID"
  | "ORDER_CANCELED"
  | "TRIP_REMINDER";

export type AdminNotificationType =
  | "NEW_ORDER"
  | "PAYMENT_RECEIVED"
  | "NEW_REVIEW"
  | "DAILY_SUMMARY";

export interface NotificationPayload {
  type: UserNotificationType | AdminNotificationType;
  title: string;
  body: string;
  /** Route internal (mis. /payment/1) — dibuka saat notifikasi diklik. */
  link?: string | null;
}

export interface NotificationDto {
  id: number;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

function toDto(row: {
  id: number;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}): NotificationDto {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    isRead: row.isRead,
    createdAt: row.createdAt.toISOString(),
  };
}

/* ----------------------------- User web ----------------------------- */

/** Buat notifikasi untuk satu user (menghormati preferensi notifWeb). */
export async function createUserNotification(
  userId: number,
  payload: NotificationPayload,
): Promise<void> {
  const user = await prisma.authUser.findUnique({
    where: { id: userId },
    select: { notifWeb: true },
  });
  if (!user?.notifWeb) return;

  await prisma.notification.create({
    data: {
      userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      link: payload.link ?? null,
    },
  });
}

/** Daftar notifikasi user (terbaru duluan). */
export async function getUserNotifications(
  userId: number,
  take = 20,
): Promise<NotificationDto[]> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
  return rows.map(toDto);
}

/** Jumlah notifikasi belum dibaca milik user. */
export async function countUnreadUserNotifications(
  userId: number,
): Promise<number> {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

/**
 * Tandai notifikasi user sebagai dibaca — satu id, atau semua bila
 * id tidak dikirim.
 */
export async function markUserNotificationsRead(
  userId: number,
  id?: number,
): Promise<void> {
  await prisma.notification.updateMany({
    where: id ? { userId, id } : { userId, isRead: false },
    data: { isRead: true },
  });
}

/* ------------------------------- Admin ------------------------------- */

/**
 * Kirim notifikasi ke semua admin relevan. Order/pembayaran/ulasan
 * dikirim ke MASTER + VIEWER (menu Pemesanan/Ulasan); AUTHOR (blog saja)
 * tidak menerima notifikasi operasional.
 */
export async function notifyAdmins(
  payload: NotificationPayload & {
    type: AdminNotificationType;
    /** Sender email admin juga? (opsional, ditangani orderEvents) */
  },
): Promise<void> {
  const admins = await prisma.authAdmin.findMany({
    where: { status: "ACTIVE", role: { in: ["MASTER", "VIEWER"] } },
    select: { id: true },
  });
  if (admins.length === 0) return;

  await prisma.adminNotification.createMany({
    data: admins.map((admin) => ({
      adminId: admin.id,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      link: payload.link ?? null,
    })),
  });
}

/** Daftar notifikasi admin (terbaru duluan). */
export async function getAdminNotifications(
  adminId: number,
  take = 20,
): Promise<NotificationDto[]> {
  const rows = await prisma.adminNotification.findMany({
    where: { adminId },
    orderBy: { createdAt: "desc" },
    take,
  });
  return rows.map(toDto);
}

/** Jumlah notifikasi belum dibaca milik admin. */
export async function countUnreadAdminNotifications(
  adminId: number,
): Promise<number> {
  return prisma.adminNotification.count({ where: { adminId, isRead: false } });
}

/** Tandai notifikasi admin sebagai dibaca (satu id atau semua). */
export async function markAdminNotificationsRead(
  adminId: number,
  id?: number,
): Promise<void> {
  await prisma.adminNotification.updateMany({
    where: id ? { adminId, id } : { adminId, isRead: false },
    data: { isRead: true },
  });
}
