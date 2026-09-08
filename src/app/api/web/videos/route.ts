import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import prisma from "@/server/db";

/**
 * Video dokumentasi aktif (YouTube) untuk web — dibungkus unstable_cache
 * (rekomendasi 1.2: caching data public). Data video jarang berubah;
 * TTL 60 detik sebagai fallback penyegaran.
 */
const getCachedVideos = unstable_cache(
  async () => {
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
    return videos.map(({ place, ...video }) => ({
      ...video,
      placeName: place?.name ?? null,
    }));
  },
  ["web-active-videos"],
  { tags: ["videos"], revalidate: 60 },
);

/** GET /api/web/videos — video dokumentasi aktif (YouTube) untuk web. */
export async function GET() {
  try {
    const data = await getCachedVideos();
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
