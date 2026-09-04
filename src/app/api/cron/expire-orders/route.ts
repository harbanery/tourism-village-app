import { NextResponse } from "next/server";
import { CRON_SECRET, NODE_ENV } from "@/config/variables";
import { expireStalePendingOrders } from "@/server/orderExpiry";

/**
 * GET /api/cron/expire-orders — sweep order PENDING kedaluwarsa → CANCELED
 * + kirim notifikasi/email cancel.
 *
 * Cadangan terjadwal untuk sweep lazy (yang sudah berjalan di endpoint order
 * web). Scheduler eksternal dapat memanggil endpoint ini per menit bila
 * diperlukan; diproteksi CRON_SECRET (header Authorization: Bearer).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expired = await expireStalePendingOrders();
    return NextResponse.json({ success: true, expired });
  } catch (err) {
    console.error("[cron/expire-orders] error:", err);
    return NextResponse.json(
      { error: "Failed to expire stale orders" },
      { status: 500 },
    );
  }
}

/** POST dev-only — jalankan sweep manual tanpa CRON_SECRET. */
export async function POST() {
  if (NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode." },
      { status: 403 },
    );
  }
  const expired = await expireStalePendingOrders();
  return NextResponse.json({ success: true, expired });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
