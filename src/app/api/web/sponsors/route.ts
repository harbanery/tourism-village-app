import { NextResponse } from "next/server";
import prisma from "@/server/db";

/** GET /api/web/sponsors — logo sponsor aktif untuk halaman depan. */
export async function GET() {
  try {
    const sponsors = await prisma.sponsor.findMany({
      where: { status: "ACTIVE" },
      orderBy: { id: "asc" },
      select: { id: true, name: true, filename: true, invertDark: true },
    });
    return NextResponse.json({ success: true, data: sponsors });
  } catch (error) {
    console.error("Error fetching sponsors:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sponsors" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
