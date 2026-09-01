import prisma from "@/server/db";
import { requireAdmin, adminCanWrite } from "@/server/auth";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/admins/[id] — aktif/nonaktifkan admin / ubah role (MASTER).
 * Tidak bisa menonaktifkan akun sendiri.
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
    const targetId = Number(id);
    const body = await request.json();

    if (targetId === admin.id) {
      return NextResponse.json(
        { success: false, error: "Tidak bisa mengubah akun sendiri." },
        { status: 400 },
      );
    }

    const updated = await prisma.authAdmin.update({
      where: { id: targetId },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.role !== undefined && { role: body.role }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        status: true,
      },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating admin:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update admin" },
      { status: 500 },
    );
  }
}

/** DELETE /api/admin/admins/[id] — hapus admin (MASTER, bukan akun sendiri). */
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
    const targetId = Number(id);
    if (targetId === admin.id) {
      return NextResponse.json(
        { success: false, error: "Tidak bisa menghapus akun sendiri." },
        { status: 400 },
      );
    }

    await prisma.authAdmin.delete({ where: { id: targetId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting admin:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete admin" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
