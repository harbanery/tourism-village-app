import prisma from "@/lib/prisma";
import { requireAdmin, adminCanWrite } from "@/lib/auth";
import { revalidatePublicCache } from "@/utils/server/cache";
import { deleteCloudinaryUrls } from "@/lib/cloudinary";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

/** PUT /api/admin/sponsors/[id] — update sponsor (MASTER). */
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

    const existing = await prisma.sponsor.findUnique({
      where: { id },
    });

    // Nilai logo berikutnya: tetap yang lama bila payload tidak menyertakan
    // field logo (undefined), kosong ("") bila dihapus dari form.
    const nextFilename =
      body.filename !== undefined ? body.filename || "" : existing?.filename ?? "";

    const sponsor = await prisma.sponsor.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description || null,
        invertDark: Boolean(body.invertDark),
        ...(body.filename !== undefined && { filename: nextFilename }),
      },
    });

    // Hapus aset Cloudinary lama bila logo diganti ATAU dikosongkan.
    if (existing?.filename && existing.filename !== nextFilename) {
      await deleteCloudinaryUrls([existing.filename]);
    }

    revalidatePublicCache(["sponsors"]);
    return NextResponse.json({ success: true, data: sponsor });
  } catch (error) {
    console.error("Error updating sponsor:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update sponsor" },
      { status: 500 },
    );
  }
}

/** PATCH /api/admin/sponsors/[id] — toggle status (MASTER). */
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
    const sponsor = await prisma.sponsor.update({
      where: { id },
      data: { status: body.status },
    });
    revalidatePublicCache(["sponsors"]);
    return NextResponse.json({ success: true, data: sponsor });
  } catch (error) {
    console.error("Error toggling sponsor status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle sponsor status" },
      { status: 500 },
    );
  }
}

/** DELETE /api/admin/sponsors/[id] — hapus sponsor (MASTER). */
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
    const sponsor = await prisma.sponsor.findUnique({
      where: { id },
    });
    await prisma.sponsor.delete({ where: { id } });
    if (sponsor?.filename) {
      await deleteCloudinaryUrls([sponsor.filename]);
    }
    revalidatePublicCache(["sponsors"]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sponsor:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete sponsor" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
