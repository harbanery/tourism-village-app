import { NextResponse } from "next/server";
import prisma from "@/server/db";

/**
 * GET /api/web/packages — paket wisata aktif untuk pengunjung web.
 * Hanya paket ACTIVE yang tempatnya juga ACTIVE (atau tanpa tempat)
 * yang ditampilkan, sehingga selalu sesuai data admin.
 */
export async function GET() {
  try {
    const packages = await prisma.package.findMany({
      where: { status: "ACTIVE" },
      orderBy: { id: "asc" },
      include: { place: { select: { id: true, name: true, status: true } } },
    });

    const data = packages
      .filter((pkg) => pkg.placeId === null || pkg.place?.status === "ACTIVE")
      .map((pkg) => ({
        id: pkg.id,
        name: pkg.name,
        placeId: pkg.placeId,
        placeName: pkg.place?.name ?? null,
        facilities: pkg.facilities,
        price: pkg.price,
      }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching packages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch packages" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
