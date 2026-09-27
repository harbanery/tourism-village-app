import { NextResponse } from "next/server";
import { NODE_ENV } from "@/utils/config/variables";
import { buildWeeklySummary, sendWeeklySummary } from "@/utils/server/orderEvents";
import { isCronAuthorized } from "@/utils/server/cronAuth";

/**
 * GET /api/cron/weekly-summary — ringkasan TREN mingguan untuk admin
 * (delta vs minggu lalu, pendapatan harian, paket terlaris) via email ke
 * MASTER + notifikasi in-app.
 *
 * Catatan jadwal: plan Vercel Hobby dibatasi 2 cron harian (sudah dipakai
 * trip-reminder + daily-summary), jadi ringkasan mingguan juga otomatis
 * dikirim oleh daily-summary setiap Senin. Endpoint ini siap dijadwalkan
 * terpisah (mis. "0 14 * * 1") bila upgrade ke Pro.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await sendWeeklySummary();
    const preview = await buildWeeklySummary();
    return NextResponse.json({ success: true, preview });
  } catch (err) {
    console.error("[cron/weekly-summary] error:", err);
    return NextResponse.json(
      { error: "Failed to send weekly summary" },
      { status: 500 },
    );
  }
}

/** POST dev-only — kirim ringkasan mingguan manual tanpa CRON_SECRET. */
export async function POST() {
  if (NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode." },
      { status: 403 },
    );
  }
  await sendWeeklySummary();
  const preview = await buildWeeklySummary();
  return NextResponse.json({ success: true, preview });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
