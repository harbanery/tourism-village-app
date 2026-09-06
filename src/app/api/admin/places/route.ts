import prisma from "@/server/db";
import { requireAdmin, adminCanWrite } from "@/server/auth";
import { NextResponse } from "next/server";

/** GET /api/admin/places — semua tempat wisata + agregat paketnya. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const [places, packagesByPlace, purchaseCounts] = await Promise.all([
      prisma.place.findMany({ orderBy: { id: "asc" } }),
      prisma.package.groupBy({
        by: ["placeId"],
        _count: { _all: true },
      }),
      // Paket populer = pernah dibayar (order item PAID) — sama seperti
      // definisi tag "Populer" di web.
      prisma.orderItem.groupBy({
        by: ["packageId"],
        where: { order: { paymentStatus: "PAID" } },
        _count: { _all: true },
      }),
    ]);

    const countByPlace = new Map(
      packagesByPlace
        .filter((row) => row.placeId !== null)
        .map((row) => [row.placeId as string, row._count._all]),
    );
    const popularPackageIds = new Set(purchaseCounts.map((row) => row.packageId));
    const popularIdsByPlace = await prisma.package.findMany({
      where: { id: { in: [...popularPackageIds] } },
      select: { placeId: true },
    });
    const popularCountByPlace = new Map<string, number>();
    for (const pkg of popularIdsByPlace) {
      if (pkg.placeId === null) continue;
      popularCountByPlace.set(
        pkg.placeId,
        (popularCountByPlace.get(pkg.placeId) ?? 0) + 1,
      );
    }

    return NextResponse.json({
      success: true,
      data: places.map((place) => ({
        ...place,
        packageCount: countByPlace.get(place.id) ?? 0,
        popularPackageCount: popularCountByPlace.get(place.id) ?? 0,
      })),
    });
  } catch (error) {
    console.error("Error fetching places:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch places" },
      { status: 500 },
    );
  }
}

/** POST /api/admin/places — tambah tempat wisata (MASTER, status awal NONACTIVE). */
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
        status: "NONACTIVE",
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
