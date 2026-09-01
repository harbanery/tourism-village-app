import prisma from "@/server/db";
import { requireAdmin, adminCanWrite } from "@/server/auth";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

/** PUT /api/admin/packages/[id] — update paket (MASTER). */
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
    const pkg = await prisma.package.update({
      where: { id: Number(id) },
      data: {
        name: body.name,
        placeId: body.placeId ?? null,
        facilities: body.facilities || [],
        price: Number(body.price) || 0,
      },
    });
    return NextResponse.json({ success: true, data: pkg });
  } catch (error) {
    console.error("Error updating package:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update package" },
      { status: 500 },
    );
  }
}

/** PATCH /api/admin/packages/[id] — toggle status (MASTER). */
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
    const pkg = await prisma.package.update({
      where: { id: Number(id) },
      data: { status: body.status },
    });
    return NextResponse.json({ success: true, data: pkg });
  } catch (error) {
    console.error("Error toggling package status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle package status" },
      { status: 500 },
    );
  }
}

/** DELETE /api/admin/packages/[id] — hapus paket (MASTER). */
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
    await prisma.package.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting package:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete package" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
