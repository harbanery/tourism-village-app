import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

/**
 * Service layer untuk akses data ulasan publik (pola progress-self:
 * service berinteraksi langsung dengan Prisma, dipanggil oleh route
 * handler / server component halaman web).
 */

/** Jumlah ulasan publik yang dikirim ke web (ambil beberapa ekstra). */
const MAX_PUBLISHED = 6;

/** DTO ulasan publik untuk halaman depan web. */
export interface PublishedReview {
  id: string;
  rating: number;
  comment: string;
  userName: string | null;
}

/**
 * Ulasan publik (dimoderasi admin) — dibungkus unstable_cache (caching
 * data public). Tag "testimonials" di-invalidate dari panel admin saat
 * moderasi/featured berubah; revalidate 60 detik sebagai fallback.
 */
const getCachedReviews = unstable_cache(
  async (): Promise<PublishedReview[]> => {
    const reviews = await prisma.testimonial.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ featured: "desc" }, { date: "desc" }],
      take: MAX_PUBLISHED,
      select: {
        id: true,
        rating: true,
        comment: true,
        user: { select: { name: true } },
      },
    });
    // Ratakan relasi user → userName (bentuk data yang dipakai web).
    return reviews.map(({ user, ...review }) => ({
      ...review,
      userName: user?.name ?? null,
    }));
  },
  ["web-published-reviews"],
  { tags: ["testimonials"], revalidate: 60 },
);

/** Ulasan publik untuk halaman depan web (dipakai halaman SSR & API). */
export function getPublishedReviews(): Promise<PublishedReview[]> {
  return getCachedReviews();
}
