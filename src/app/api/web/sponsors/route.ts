import { NextResponse } from "next/server";
import { getActiveSponsors } from "@/services/sponsor";

/** GET /api/web/sponsors — logo sponsor aktif untuk halaman depan. */
export async function GET() {
  try {
    const data = await getActiveSponsors();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching sponsors:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sponsors" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
