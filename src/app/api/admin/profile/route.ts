import prisma from "@/server/db";
import { requireAdmin } from "@/server/auth";
import { deleteCloudinaryUrls } from "@/server/cloudinary";
import { NextResponse } from "next/server";

/**
 * PUT /api/admin/profile — perbarui profil sendiri.
 * Hanya avatar dan nama yang boleh diubah (email & role read-only).
 */
export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const body = await request.json();

    const name =
      typeof body.name === "string" && body.name.trim()
        ? body.name.trim().slice(0, 100)
        : null;
    const avatar =
      typeof body.avatar === "string" && body.avatar ? body.avatar : null;

    // Hapus aset Cloudinary lama bila avatar diganti/dihapus.
    if (admin.avatar && admin.avatar !== avatar) {
      await deleteCloudinaryUrls([admin.avatar]);
    }

    const updated = await prisma.authAdmin.update({
      where: { id: admin.id },
      data: { name, avatar },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        role: true,
        status: true,
      },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
