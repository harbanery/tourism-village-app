import prisma from "@/server/db";
import { requireAdmin } from "@/server/auth";
import { NextResponse } from "next/server";

/** GET /api/admin/testimonials — semua ulasan + data user. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { date: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    return NextResponse.json({ success: true, data: testimonials });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch testimonials" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
