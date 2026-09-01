import prisma from "@/server/db";
import { requireAdmin, adminCanWriteBlog } from "@/server/auth";
import { deleteCloudinaryUrls } from "@/server/cloudinary";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

/**
 * PUT /api/admin/blogs/[id] — update blog (MASTER | AUTHOR).
 * Author hanya boleh mengubah blog miliknya.
 */
export async function PUT(request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin || !adminCanWriteBlog(admin)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.blog.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Blog not found" },
        { status: 404 },
      );
    }
    if (admin.role === "AUTHOR" && existing.adminId !== admin.id) {
      return NextResponse.json(
        { success: false, error: "Author hanya bisa mengubah blog miliknya" },
        { status: 403 },
      );
    }

    const blog = await prisma.blog.update({
      where: { id: Number(id) },
      data: {
        title: body.title,
        ...(body.filename !== undefined && { filename: body.filename || "" }),
        para: body.para,
        datetimeAfter: new Date(),
      },
    });

    if (
      existing &&
      body.filename &&
      existing.filename &&
      existing.filename !== body.filename
    ) {
      await deleteCloudinaryUrls([existing.filename]);
    }

    return NextResponse.json({ success: true, data: blog });
  } catch (error) {
    console.error("Error updating blog:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update blog" },
      { status: 500 },
    );
  }
}

/** PATCH /api/admin/blogs/[id] — toggle status (MASTER | AUTHOR pemilik). */
export async function PATCH(request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin || !adminCanWriteBlog(admin)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const { id } = await params;
    const body = await request.json();

    if (admin.role === "AUTHOR") {
      const existing = await prisma.blog.findUnique({
        where: { id: Number(id) },
      });
      if (!existing || existing.adminId !== admin.id) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 },
        );
      }
    }

    const blog = await prisma.blog.update({
      where: { id: Number(id) },
      data: { status: body.status },
    });
    return NextResponse.json({ success: true, data: blog });
  } catch (error) {
    console.error("Error toggling blog status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle blog status" },
      { status: 500 },
    );
  }
}

/** DELETE /api/admin/blogs/[id] — hapus blog (MASTER | AUTHOR pemilik). */
export async function DELETE(_request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin || !adminCanWriteBlog(admin)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const { id } = await params;
    const blog = await prisma.blog.findUnique({
      where: { id: Number(id) },
    });
    if (!blog) {
      return NextResponse.json(
        { success: false, error: "Blog not found" },
        { status: 404 },
      );
    }
    if (admin.role === "AUTHOR" && blog.adminId !== admin.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    await prisma.blog.delete({ where: { id: Number(id) } });
    if (blog.filename) {
      await deleteCloudinaryUrls([blog.filename]);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blog:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete blog" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
