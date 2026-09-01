import prisma from "@/server/db";
import { requireAdmin, adminCanWrite } from "@/server/auth";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/admin/users/[id] — aktif/nonaktifkan user (MASTER). */
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
    const user = await prisma.authUser.update({
      where: { id: Number(id) },
      data: { status: body.status },
      select: { id: true, name: true, email: true, status: true },
    });
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Error toggling user status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle user status" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
