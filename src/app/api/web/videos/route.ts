import { NextResponse } from "next/server";
import prisma from "@/server/db";

/**
 * GET /api/web/videos — video dokumentasi aktif (YouTube) untuk web.
 * Hanya status ACTIVE yang tampil; urut terbaru dulu.
 */
export async function GET() {
  try {
    const videos = await prisma.video.findMany({
      where: { status: "ACTIVE" },
      orderBy: { id: "desc" },
      select: {
        id: true,
        name: true,
        linkCode: true,
        place: { select: { name: true } },
      },
    });
    // Ratakan relasi place → placeName (bentuk data yang dipakai web).
    const data = videos.map(({ place, ...video }) => ({
      ...video,
      placeName: place?.name ?? null,
    }));
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
