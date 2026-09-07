import { NextResponse } from "next/server";
import prisma from "@/server/db";

/**
 * GET /api/web/blogs — daftar blog aktif untuk halaman artikel web.
 * Hanya status ACTIVE yang tampil; urut terbaru dulu.
 */
export async function GET() {
  try {
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
    const data = blogs.map(({ admin, ...blog }) => ({
      ...blog,
      adminName: admin?.name ?? null,
    }));
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
