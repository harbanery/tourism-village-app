import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import prisma from "@/server/db";

/**
 * Daftar blog aktif untuk halaman artikel web — dibungkus unstable_cache
 * (rekomendasi 1.2: caching data public). Tag "blogs" di-invalidate dari
 * panel admin saat blog dibuat/diubah/di-nonaktifkan.
 */
const getCachedBlogs = unstable_cache(
  async () => {
    const blogs = await prisma.blog.findMany({
      where: { status: "ACTIVE" },
      orderBy: { datetime: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        filename: true,
        para: true,
        datetime: true,
        datetimeAfter: true,
        admin: { select: { name: true } },
      },
    });
    // Ratakan relasi admin → adminName (bentuk data yang dipakai web).
    return blogs.map(({ admin, ...blog }) => ({
      ...blog,
      adminName: admin?.name ?? null,
    }));
  },
  ["web-active-blogs"],
  { tags: ["blogs"], revalidate: 60 },
);

/** GET /api/web/blogs — daftar blog aktif untuk halaman artikel web. */
export async function GET() {
  try {
    const data = await getCachedBlogs();
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
