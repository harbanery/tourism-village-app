import prisma from "@/server/db";
import { requireAdmin, adminCanWrite } from "@/server/auth";
import { NextResponse } from "next/server";

/** GET /api/admin/packages — semua paket wisata + nama tempat. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const packages = await prisma.package.findMany({
      orderBy: { id: "asc" },
      include: { place: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ success: true, data: packages });
  } catch (error) {
    console.error("Error fetching packages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch packages" },
      { status: 500 },
    );
  }
}

/** POST /api/admin/packages — tambah paket (MASTER, status awal NONACTIVE). */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin || !adminCanWrite(admin)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const body = await request.json();
    const pkg = await prisma.package.create({
      data: {
        name: body.name,
        placeId: body.placeId ?? null,
        facilities: body.facilities || [],
        price: Number(body.price) || 0,
        status: "NONACTIVE",
      },
    });
    return NextResponse.json({ success: true, data: pkg }, { status: 201 });
  } catch (error) {
    console.error("Error creating package:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create package" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
