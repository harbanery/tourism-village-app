import { NextResponse } from "next/server";
import { NODE_ENV } from "@/utils/config/variables";
import { expireStalePendingOrders } from "@/utils/server/orderExpiry";
import { isCronAuthorized } from "@/utils/server/cronAuth";

/**
 * GET /api/cron/expire-orders — sweep order PENDING kedaluwarsa → CANCELED
 * + kirim notifikasi/email cancel.
 *
 * Cadangan terjadwal untuk sweep lazy (yang sudah berjalan di endpoint order
 * web). Scheduler eksternal dapat memanggil endpoint ini per menit bila
 * diperlukan; diproteksi CRON_SECRET (header Authorization: Bearer,
 * konstan-waktu + tolak secret kosong — rekomendasi 2.6).
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
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
