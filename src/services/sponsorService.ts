import { unstable_cache } from "next/cache";
import prisma from "@/server/db";

/**
 * Service layer untuk akses data sponsor (pola progress-self: service
 * berinteraksi langsung dengan Prisma, dipanggil oleh route handler /
 * server component halaman web).
 */

/** DTO sponsor aktif untuk halaman depan web. */
export interface ActiveSponsor {
  id: string;
  name: string;
  filename: string;
  /** Logo gelap (mis. hitam) — dibalik jadi putih di dark mode. */
  invertDark: boolean;
}

/**
 * Logo sponsor aktif — dibungkus unstable_cache (caching data public).
 * Tag "sponsors" di-invalidate dari panel admin saat sponsor dibuat/
 * diubah/di-nonaktifkan; revalidate 60 detik sebagai fallback.
 */
const getCachedSponsors = unstable_cache(
  async (): Promise<ActiveSponsor[]> => {
    return prisma.sponsor.findMany({
      where: { status: "ACTIVE" },
      orderBy: { id: "asc" },
      select: { id: true, name: true, filename: true, invertDark: true },
    });
  },
  ["web-active-sponsors"],
  { tags: ["sponsors"], revalidate: 60 },
);

/** Sponsor aktif untuk halaman depan (dipakai halaman SSR & API). */
export function getActiveSponsors(): Promise<ActiveSponsor[]> {
  return getCachedSponsors();
}
