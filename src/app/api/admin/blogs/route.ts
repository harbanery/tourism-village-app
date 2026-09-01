import prisma from "@/server/db";
import { requireAdmin, adminCanWriteBlog } from "@/server/auth";
import { NextResponse } from "next/server";

/** GET /api/admin/blogs — semua blog + penulis. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const blogs = await prisma.blog.findMany({
      orderBy: { datetime: "desc" },
      include: {
        admin: { select: { id: true, username: true, name: true } },
        place: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ success: true, data: blogs });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch blogs" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/blogs — tambah blog (MASTER | AUTHOR).
 * Data baru dibuat NONACTIVE dulu; aktifkan lewat opsi (MASTER).
 */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin || !adminCanWriteBlog(admin)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const body = await request.json();
    const blog = await prisma.blog.create({
      data: {
        adminId: admin.id,
        placeId: body.placeId ?? null,
        title: body.title,
        filename: body.filename || "",
        para: body.para || "",
        status: "NONACTIVE",
      },
      include: {
        admin: { select: { id: true, username: true, name: true } },
        place: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ success: true, data: blog }, { status: 201 });
  } catch (error) {
    console.error("Error creating blog:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create blog" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
