import prisma from "@/server/db";
import { requireAdmin, adminCanWrite } from "@/server/auth";
import { deleteCloudinaryUrls } from "@/server/cloudinary";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

/** PUT /api/admin/places/[id] — update tempat wisata (MASTER). */
export async function PUT(request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin || !adminCanWrite(admin)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.place.findUnique({
      where: { id: Number(id) },
    });

    const place = await prisma.place.update({
      where: { id: Number(id) },
      data: {
        name: body.name,
        ...(body.photo !== undefined && { photo: body.photo || null }),
      },
    });

    // Hapus aset Cloudinary lama bila foto diganti.
    if (existing && body.photo && existing.photo && existing.photo !== body.photo) {
      await deleteCloudinaryUrls([existing.photo]);
    }

    return NextResponse.json({ success: true, data: place });
  } catch (error) {
    console.error("Error updating place:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update place" },
      { status: 500 },
    );
  }
}

/** PATCH /api/admin/places/[id] — toggle status aktif/nonaktif (MASTER). */
export async function PATCH(request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin || !adminCanWrite(admin)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const { id } = await params;
    const body = await request.json();
    const place = await prisma.place.update({
      where: { id: Number(id) },
      data: { status: body.status },
    });
    return NextResponse.json({ success: true, data: place });
  } catch (error) {
    console.error("Error toggling place status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle place status" },
      { status: 500 },
    );
  }
}

/** DELETE /api/admin/places/[id] — hapus tempat wisata (MASTER). */
export async function DELETE(_request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin || !adminCanWrite(admin)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const { id } = await params;
    const place = await prisma.place.findUnique({
      where: { id: Number(id) },
    });
    await prisma.place.delete({ where: { id: Number(id) } });
    if (place?.photo) {
      await deleteCloudinaryUrls([place.photo]);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting place:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete place" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
