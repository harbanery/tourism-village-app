import { NextRequest, NextResponse } from "next/server";
import prisma from "@/server/db";
import { getCurrentUser } from "@/server/auth";

/**
 * PATCH /api/web/profile/notifications — preferensi notifikasi user
 * (in-app & email). Dipakai oleh fitur notifikasi web, send email, dan
 * vercel cron mendatang agar hanya mengirim ke user yang mengizinkan.
 */
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const notifWeb =
      typeof body.notifWeb === "boolean" ? body.notifWeb : undefined;
    const notifEmail =
      typeof body.notifEmail === "boolean" ? body.notifEmail : undefined;

    if (notifWeb === undefined && notifEmail === undefined) {
      return NextResponse.json(
        { success: false, error: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const updated = await prisma.authUser.update({
      where: { id: user.id },
      data: {
        ...(notifWeb !== undefined ? { notifWeb } : {}),
        ...(notifEmail !== undefined ? { notifEmail } : {}),
      },
      select: { notifWeb: true, notifEmail: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
