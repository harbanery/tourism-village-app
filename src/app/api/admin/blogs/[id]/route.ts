import prisma from "@/lib/prisma";
import { requireAdmin, adminCanWriteBlog } from "@/lib/auth";
import { revalidatePublicCache } from "@/utils/server/cache";
import { deleteCloudinaryUrls } from "@/lib/cloudinary";
import { blogSlugBase, uniqueBlogSlug } from "@/utils/server/blogSlug";
import { sanitizeRichText } from "@/utils/server/sanitize";
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
      where: { id },
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

    // Nilai foto berikutnya: tetap yang lama bila payload tidak menyertakan
    // field foto (undefined), kosong ("") bila dihapus dari form.
    const nextFilename =
      body.filename !== undefined ? body.filename || "" : existing.filename;

    // Slug: dari form (bisa diisi sendiri); kosong → generate dari judul.
    // Di-sanitize kebab-case dan dipastikan unik (kecuali blog ini sendiri).
    const slugBase = blogSlugBase(body.slug, body.title ?? existing.title);
    const nextSlug =
      slugBase === existing.slug
        ? existing.slug // tidak berubah — skip cek unik
        : await uniqueBlogSlug(slugBase, existing.id);

    const blog = await prisma.blog.update({
      where: { id },
      data: {
        title: body.title,
        slug: nextSlug,
        ...(body.placeId !== undefined && { placeId: body.placeId ?? null }),
        ...(body.filename !== undefined && { filename: nextFilename }),
        // Rich text disanitasi server-side sebelum disimpan (rekom 2.2).
        para: sanitizeRichText(body.para ?? existing.para),
        datetimeAfter: new Date(),
      },
      include: {
        admin: { select: { id: true, username: true, name: true } },
        place: { select: { id: true, name: true } },
      },
    });

    // Hapus aset Cloudinary lama bila foto diganti ATAU dikosongkan.
    if (existing.filename && existing.filename !== nextFilename) {
      await deleteCloudinaryUrls([existing.filename]);
    }

    revalidatePublicCache(["blogs"]);
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
        where: { id },
      });
      if (!existing || existing.adminId !== admin.id) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 },
        );
      }
    }

    const blog = await prisma.blog.update({
      where: { id },
      data: { status: body.status },
    });
    revalidatePublicCache(["blogs"]);
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
      where: { id },
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

    await prisma.blog.delete({ where: { id } });
    if (blog.filename) {
      await deleteCloudinaryUrls([blog.filename]);
    }
    revalidatePublicCache(["blogs"]);
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
