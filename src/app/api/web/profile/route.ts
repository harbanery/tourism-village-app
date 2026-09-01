import { NextResponse } from "next/server";
import prisma from "@/server/db";
import { getCurrentUser } from "@/server/auth";

/** GET /api/web/profile — data user + riwayat pesanan. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { dateOrder: "desc" },
    include: {
      items: { include: { package: true } },
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        gender: user.gender,
        birthDate: user.birthDate,
        address: user.address,
        avatar: user.avatar,
      },
      orders: orders.map((order) => ({
        id: order.id,
        dateOrder: order.dateOrder.toISOString(),
        dateSchedule: order.dateSchedule.toISOString(),
        homestay: order.homestay,
        homestayTime: order.homestayTime,
        totalPrice: order.totalPrice,
        items: order.items.map((item) => ({
          id: item.id,
          packageName: item.package.name,
          quantity: item.quantity,
          price: item.price,
        })),
      })),
    },
  });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
