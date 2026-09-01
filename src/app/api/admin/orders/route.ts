import prisma from "@/server/db";
import { requireAdmin } from "@/server/auth";
import { NextResponse } from "next/server";

/** GET /api/admin/orders — semua pemesanan + user + item (MASTER | VIEWER). */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const orders = await prisma.order.findMany({
      orderBy: { dateOrder: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: { include: { package: { select: { name: true } } } },
      },
    });
    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
