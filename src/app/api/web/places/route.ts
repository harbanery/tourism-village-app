import { NextResponse } from "next/server";
import { getPlacesWithPackages } from "@/services/placeService";

/**
 * GET /api/web/places — tempat wisata aktif + paket aktifnya + total
 * pembelian (PAID) per tempat (dasar urutan wisata populer di home).
 */
export async function GET() {
  try {
    const places = await getPlacesWithPackages();
    return NextResponse.json({ success: true, data: places });
  } catch (error) {
    console.error("Error fetching places:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch places" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
