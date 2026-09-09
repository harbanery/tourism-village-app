import { unstable_cache } from "next/cache";
import prisma from "@/server/db";

/**
 * Service layer untuk akses data video dokumentasi (pola progress-self:
 * service berinteraksi langsung dengan Prisma, dipanggil oleh route
 * handler / server component halaman web).
 */

/** DTO video dokumentasi aktif untuk web. */
export interface ActiveVideo {
  id: string;
  name: string;
  /** YouTube video id. */
  linkCode: string;
  placeName: string | null;
}

/**
 * Video dokumentasi aktif (YouTube) — dibungkus unstable_cache (caching
 * data public). Tag "videos" di-invalidate dari panel admin; revalidate
 * 60 detik sebagai fallback penyegaran.
 */
const getCachedVideos = unstable_cache(
  async (): Promise<ActiveVideo[]> => {
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

/** Video dokumentasi aktif (dipakai halaman SSR & API). */
export function getActiveVideos(): Promise<ActiveVideo[]> {
  return getCachedVideos();
}
