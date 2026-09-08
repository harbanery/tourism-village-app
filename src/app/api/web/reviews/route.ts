import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import prisma from "@/server/db";

/** Jumlah ulasan publik yang dikirim ke web (ambil beberapa ekstra). */
const MAX_PUBLISHED = 6;

/**
 * Ulasan publik untuk halaman depan web — dibungkus unstable_cache
 * (rekomendasi 1.2: caching data public). Tag "testimonials"
 * di-invalidate dari panel admin saat moderasi/featured berubah.
 */
const getCachedReviews = unstable_cache(
  async () => {
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

/** GET /api/web/reviews — ulasan publik untuk halaman depan web. */
export async function GET() {
  try {
    const data = await getCachedReviews();
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
