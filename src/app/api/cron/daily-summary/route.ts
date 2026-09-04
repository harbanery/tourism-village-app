import { NextResponse } from "next/server";
import { CRON_SECRET, NODE_ENV } from "@/config/variables";
import { buildDailySummary, sendDailySummary } from "@/server/orderEvents";

/**
 * GET /api/cron/daily-summary — ringkasan harian order & pendapatan untuk
 * admin (email ke MASTER + notifikasi in-app). Dijadwalkan Vercel Cron
 * setiap hari 21:00 WIB (14:00 UTC).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await sendDailySummary();
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
  const preview = await buildDailySummary();
  return NextResponse.json({ success: true, preview });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
