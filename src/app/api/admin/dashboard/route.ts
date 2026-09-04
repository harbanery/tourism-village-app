import prisma from "@/server/db";
import { requireAdmin } from "@/server/auth";
import { NextResponse } from "next/server";
import {
  getDashboardAnalytics,
  type DashboardPeriod,
} from "@/services/dashboardService";

/**
 * GET /api/admin/dashboard?period=7|30|90 - statistik panel admin.
 *
 * - Bagian lama (kartu jumlah + 5 order terbaru) tetap dikirim.
 * - `analytics` berisi data grafik transaksi: KPI pendapatan/AOV/sukses
 *   bayar, tren harian, distribusi status, paket terlaris, rasio menginap,
 *   dan pembeli baru vs kembali.
 */
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const rawPeriod = Number(url.searchParams.get("period") ?? "30");
  const period: DashboardPeriod = [7, 30, 90].includes(rawPeriod)
    ? (rawPeriod as DashboardPeriod)
    : 30;

  try {
    const [
      activePlaces,
      totalPlaces,
      totalPackages,
      totalOrders,
      totalTestimonials,
      recentOrders,
      analytics,
    ] = await Promise.all([
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
      getDashboardAnalytics(period),
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
          paymentStatus: order.paymentStatus,
        })),
        analytics,
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