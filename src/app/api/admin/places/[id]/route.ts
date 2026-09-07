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
      where: { id },
    });

    // Nilai foto berikutnya: tetap yang lama bila payload tidak menyertakan
    // field foto (undefined), kosong (null/"") bila dihapus dari form.
    const nextPhoto =
      body.photo !== undefined ? body.photo || null : existing?.photo ?? null;

    const place = await prisma.place.update({
      where: { id },
      data: {
        name: body.name,
        ...(body.description !== undefined && {
          description: body.description || null,
        }),
        ...(body.photo !== undefined && { photo: nextPhoto }),
      },
    });

    // Hapus aset Cloudinary lama bila foto diganti ATAU dikosongkan.
    if (existing?.photo && existing.photo !== nextPhoto) {
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

/**
 * PATCH /api/admin/places/[id] — toggle status aktif/nonaktif (MASTER).
 *
 * Menonaktifkan tempat wisata otomatis menonaktifkan semua paket yang
 * terhubung (transaksi atomik). Mengaktifkan kembali tempat TIDAK
 * mengaktifkan paketnya — setiap paket diaktifkan manual di menu paket.
 */
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
    const nextStatus =
      body.status === "ACTIVE" ? "ACTIVE" : "NONACTIVE";

    const place = await prisma.place.update({
      where: { id },
      data: { status: nextStatus },
    });

    // Cascade: tempat nonaktif → paket yang terhubung ikut nonaktif.
    if (nextStatus === "NONACTIVE") {
      await prisma.package.updateMany({
        where: { placeId: place.id, status: "ACTIVE" },
        data: { status: "NONACTIVE" },
      });
    }

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
      where: { id },
    });
    await prisma.place.delete({ where: { id } });
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
