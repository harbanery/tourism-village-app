import prisma from "@/server/db";
import { requireAdmin, adminCanWrite } from "@/server/auth";
import { NextResponse } from "next/server";

/** GET /api/admin/packages — semua paket wisata + tempat + hitungan beli. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const [packages, purchaseCounts] = await Promise.all([
      prisma.package.findMany({
        orderBy: { id: "asc" },
        include: {
          place: { select: { id: true, name: true, status: true } },
        },
      }),
      // Paket populer = pernah dibayar (order item PAID) — sama seperti
      // definisi tag "Populer" di web.
      prisma.orderItem.groupBy({
        by: ["packageId"],
        where: { order: { paymentStatus: "PAID" } },
        _sum: { quantity: true },
      }),
    ]);

    const countByPackage = new Map(
      purchaseCounts.map((row) => [row.packageId, row._sum.quantity ?? 0]),
    );

    return NextResponse.json({
      success: true,
      data: packages.map((pkg) => ({
        ...pkg,
        timesPurchased: countByPackage.get(pkg.id) ?? 0,
      })),
    });
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
