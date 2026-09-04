import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import {
  countUnreadUserNotifications,
  getUserNotifications,
  markUserNotificationsRead,
} from "@/services/notificationService";

/**
 * GET /api/web/notifications — daftar notifikasi user login (terbaru duluan)
 * + jumlah belum dibaca. Dipakai bell icon di navbar (polling ringan).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const [items, unreadCount] = await Promise.all([
    getUserNotifications(user.id),
    countUnreadUserNotifications(user.id),
  ]);

  return NextResponse.json({ success: true, data: { items, unreadCount } });
}

/**
 * PATCH /api/web/notifications — tandai dibaca.
 * Body: { id?: number } — id tertentu, atau semua bila kosong.
 */
export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  let id: number | undefined;
  try {
    const body = (await request.json()) as { id?: number };
    if (body.id !== undefined) {
      if (!Number.isInteger(body.id)) {
        return NextResponse.json(
          { success: false, error: "Invalid id" },
          { status: 400 },
        );
      }
      id = body.id;
    }
  } catch {
    // Body kosong → tandai semua dibaca.
  }

  await markUserNotificationsRead(user.id, id);
  const unreadCount = await countUnreadUserNotifications(user.id);
  return NextResponse.json({ success: true, data: { unreadCount } });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
