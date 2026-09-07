import { NextResponse } from "next/server";
import prisma from "@/server/db";

/** Jumlah ulasan publik yang dikirim ke web (ambil beberapa ekstra). */
const MAX_PUBLISHED = 6;

/**
 * GET /api/web/reviews — ulasan publik untuk halaman depan web.
 * Hanya status ACTIVE; utama (featured) dulu, lalu terbaru.
 */
export async function GET() {
  try {
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
    const data = reviews.map(({ user, ...review }) => ({
      ...review,
      userName: user?.name ?? null,
    }));
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
