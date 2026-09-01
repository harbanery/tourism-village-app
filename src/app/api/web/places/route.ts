import { NextResponse } from "next/server";
import prisma from "@/server/db";

/** GET /api/web/places — tempat wisata aktif (publik, sesuai data admin). */
export async function GET() {
  try {
    const places = await prisma.place.findMany({
      where: { status: "ACTIVE" },
      orderBy: { id: "asc" },
      select: { id: true, name: true, photo: true },
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

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
