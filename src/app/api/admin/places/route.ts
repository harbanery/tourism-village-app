import prisma from "@/server/db";
import { requireAdmin, adminCanWrite } from "@/server/auth";
import { NextResponse } from "next/server";

/** GET /api/admin/places — semua tempat wisata. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const places = await prisma.place.findMany({
      orderBy: { id: "asc" },
    });
    return NextResponse.json({ success: true, data: places });
  } catch (error) {
    console.error("Error fetching places:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch places" },
      { status: 500 },
    );
  }
}

/** POST /api/admin/places — tambah tempat wisata (MASTER). */
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
    const place = await prisma.place.create({
      data: {
        name: body.name,
        photo: body.photo || null,
        status: "ACTIVE",
      },
    });
    return NextResponse.json({ success: true, data: place }, { status: 201 });
  } catch (error) {
    console.error("Error creating place:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create place" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
