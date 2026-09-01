import prisma from "@/server/db";
import { requireAdmin } from "@/server/auth";
import { NextResponse } from "next/server";

/** GET /api/admin/dashboard — ringkasan statistik panel admin. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const [activePlaces, totalPlaces, totalPackages, totalOrders, totalTestimonials, recentOrders] =
      await Promise.all([
        prisma.place.count({ where: { status: "ACTIVE" } }),
        prisma.place.count(),
        prisma.package.count(),
        prisma.order.count(),
        prisma.testimonial.count({ where: { status: "ACTIVE" } }),
        prisma.order.findMany({
          orderBy: { dateOrder: "desc" },
          take: 5,
          include: {
            user: { select: { name: true } },
          },
        }),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        activePlaces,
        totalPlaces,
        totalPackages,
        totalOrders,
        totalTestimonials,
        recentOrders: recentOrders.map((order) => ({
          id: order.id,
          userName: order.user.name,
          dateOrder: order.dateOrder.toISOString(),
          dateSchedule: order.dateSchedule.toISOString(),
          totalPrice: order.totalPrice,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
