import { NextResponse } from "next/server";
import { getPublishedReviews } from "@/services/review";

/** GET /api/web/reviews — ulasan publik untuk halaman depan. */
export async function GET() {
  try {
    const data = await getPublishedReviews();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
