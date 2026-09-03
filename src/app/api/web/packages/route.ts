import { NextResponse } from "next/server";
import { getActivePackages } from "@/services/packageService";

/**
 * GET /api/web/packages — paket wisata aktif untuk pengunjung web
 * (query dipusatkan di packageService).
 */
export async function GET() {
  try {
    const data = await getActivePackages();
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
