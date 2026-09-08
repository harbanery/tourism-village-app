import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import prisma from "@/server/db";

/**
 * Logo sponsor aktif untuk halaman depan — dibungkus unstable_cache
 * (rekomendasi 1.2: caching data public). Tag "sponsors" di-invalidate
 * dari panel admin saat sponsor dibuat/diubah/di-nonaktifkan.
 */
const getCachedSponsors = unstable_cache(
  async () => {
    return prisma.sponsor.findMany({
      where: { status: "ACTIVE" },
      orderBy: { id: "asc" },
      select: { id: true, name: true, filename: true, invertDark: true },
    });
  },
  ["web-active-sponsors"],
  { tags: ["sponsors"], revalidate: 60 },
);

/** GET /api/web/sponsors — logo sponsor aktif untuk halaman depan. */
export async function GET() {
  try {
    const data = await getCachedSponsors();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching sponsors:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sponsors" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
