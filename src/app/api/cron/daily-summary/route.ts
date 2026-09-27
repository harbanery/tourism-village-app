import { NextResponse } from "next/server";
import { NODE_ENV } from "@/utils/config/variables";
import {
  buildDailySummary,
  sendDailySummary,
  sendWeeklySummary,
} from "@/utils/server/orderEvents";
import { isCronAuthorized } from "@/utils/server/cronAuth";

/**
 * GET /api/cron/daily-summary — ringkasan harian order & pendapatan untuk
 * admin (email ke MASTER + notifikasi in-app). Dijadwalkan Vercel Cron
 * setiap hari 21:00 WIB (14:00 UTC).
 *
 * Setiap Senin juga mengirim ringkasan MINGGUAN (tren) — menumpang di sini
 * karena plan Vercel Hobby dibatasi 2 cron harian (trip-reminder + ini);
 * endpoint /api/cron/weekly-summary tersedia untuk jadwal terpisah.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await sendDailySummary();
    if (new Date().getDay() === 1) {
      await sendWeeklySummary();
    }
    const preview = await buildDailySummary();
    return NextResponse.json({ success: true, preview });
  } catch (err) {
    console.error("[cron/daily-summary] error:", err);
    return NextResponse.json(
      { error: "Failed to send daily summary" },
      { status: 500 },
    );
  }
}

/** POST dev-only — kirim ringkasan manual tanpa CRON_SECRET. */
export async function POST() {
  if (NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode." },
      { status: 403 },
    );
  }
  await sendDailySummary();
  if (new Date().getDay() === 1) {
    await sendWeeklySummary();
  }
  const preview = await buildDailySummary();
  return NextResponse.json({ success: true, preview });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
