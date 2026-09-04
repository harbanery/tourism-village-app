import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { getActivePackages } from "@/services/packageService";

/**
 * GET /api/web/packages — paket wisata aktif untuk pengunjung web
 * (query dipusatkan di packageService). Bila user login, sertakan hitungan
 * pembelian pribadinya (untuk section "sering dibeli" per user).
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    const data = await getActivePackages(user?.id ?? null);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching packages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch packages" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
