import { NextResponse } from "next/server";
import { getActiveBlogs } from "@/services/blogService";

/** GET /api/web/blogs — daftar blog aktif untuk halaman artikel web. */
export async function GET() {
  try {
    const data = await getActiveBlogs();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch blogs" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
