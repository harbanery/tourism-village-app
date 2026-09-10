import { NextResponse } from "next/server";
import { getActiveBlogs } from "@/services/blog";

/**
 * GET /api/web/blogs — daftar blog aktif untuk halaman artikel web.
 * Pagination opsional via query: `?take=10&skip=0` (take maks 50).
 * Tanpa parameter → seluruh artikel (kompatibel pemakaian lama).
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const takeRaw = Number(url.searchParams.get("take")) || 0;
    const skip = Math.max(Number(url.searchParams.get("skip")) || 0, 0);
    const take = Math.min(Math.max(takeRaw, 0), 50);

    const all = await getActiveBlogs();
    const data = take > 0 ? all.slice(skip, skip + take) : all.slice(skip);

    return NextResponse.json({
      success: true,
      data,
      total: all.length,
      hasMore: skip + data.length < all.length,
    });
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
