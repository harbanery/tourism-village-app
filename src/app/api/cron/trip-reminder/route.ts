import { NextResponse } from "next/server";
import { CRON_SECRET, NODE_ENV } from "@/config/variables";
import { sendTripReminders } from "@/server/orderEvents";

/**
 * GET /api/cron/trip-reminder — pengingat jadwal H-1 keberangkatan.
 * Dijadwalkan Vercel Cron setiap hari 07:00 WIB (00:00 UTC); item PAID
 * yang berangkat besok menghasilkan notifikasi + email ke user.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notified = await sendTripReminders();
    return NextResponse.json({ success: true, notified });
  } catch (err) {
    console.error("[cron/trip-reminder] error:", err);
    return NextResponse.json(
      { error: "Failed to send trip reminders" },
      { status: 500 },
    );
  }
}

/** POST dev-only — kirim pengingat manual tanpa CRON_SECRET. */
export async function POST() {
  if (NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode." },
      { status: 403 },
    );
  }
  const notified = await sendTripReminders();
  return NextResponse.json({ success: true, notified });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
