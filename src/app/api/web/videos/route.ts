import { NextResponse } from "next/server";
import { getActiveVideos } from "@/services/videoService";

/** GET /api/web/videos — video dokumentasi aktif (YouTube) untuk web. */
export async function GET() {
  try {
    const data = await getActiveVideos();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch videos" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
