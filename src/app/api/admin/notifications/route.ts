import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  countUnreadAdminNotifications,
  getAdminNotifications,
  markAdminNotificationsRead,
} from "@/services/notification";

/**
 * GET /api/admin/notifications — daftar notifikasi admin login (terbaru
 * duluan) + jumlah belum dibaca. Dipakai bell icon di header panel admin.
 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const [items, unreadCount] = await Promise.all([
    getAdminNotifications(admin.id),
    countUnreadAdminNotifications(admin.id),
  ]);

  return NextResponse.json({ success: true, data: { items, unreadCount } });
}

/**
 * PATCH /api/admin/notifications — tandai dibaca.
 * Body: { id?: string } — id tertentu, atau semua bila kosong.
 */
export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  let id: string | undefined;
  try {
    const body = (await request.json()) as { id?: string };
    if (body.id !== undefined) {
      if (typeof body.id !== "string" || body.id.length === 0) {
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

  await markAdminNotificationsRead(admin.id, id);
  const unreadCount = await countUnreadAdminNotifications(admin.id);
  return NextResponse.json({ success: true, data: { unreadCount } });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
