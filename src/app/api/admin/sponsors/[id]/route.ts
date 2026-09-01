import prisma from "@/server/db";
import { requireAdmin, adminCanWrite } from "@/server/auth";
import { deleteCloudinaryUrls } from "@/server/cloudinary";
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
      where: { id: Number(id) },
    });

    const sponsor = await prisma.sponsor.update({
      where: { id: Number(id) },
      data: {
        name: body.name,
        description: body.description || null,
        ...(body.filename !== undefined && { filename: body.filename || "" }),
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
      where: { id: Number(id) },
      data: { status: body.status },
    });
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
      where: { id: Number(id) },
    });
    await prisma.sponsor.delete({ where: { id: Number(id) } });
    if (sponsor?.filename) {
      await deleteCloudinaryUrls([sponsor.filename]);
    }
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
