import prisma from "@/server/db";
import { requireAdmin, adminCanWrite } from "@/server/auth";
import { MAX_FEATURED_TESTIMONIALS } from "@/config/variables";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/testimonials/[id] — moderasi ulasan (MASTER).
 * Body: { status?: "ACTIVE" | "NONACTIVE", featured?: boolean }
 * `featured` (utama) dibatasi maksimal 3.
 */
export async function PATCH(request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin || !adminCanWrite(admin)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.featured === true) {
      const count = await prisma.testimonial.count({
        where: { featured: true },
      });
      const current = await prisma.testimonial.findUnique({
        where: { id: Number(id) },
      });
      if (!current?.featured && count >= MAX_FEATURED_TESTIMONIALS) {
        return NextResponse.json(
          {
            success: false,
            error: `Maksimal ${MAX_FEATURED_TESTIMONIALS} ulasan utama. Nonaktifkan utama pada ulasan lain terlebih dahulu.`,
          },
          { status: 400 },
        );
      }
    }

    const testimonial = await prisma.testimonial.update({
      where: { id: Number(id) },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.featured !== undefined && { featured: body.featured }),
      },
    });
    return NextResponse.json({ success: true, data: testimonial });
  } catch (error) {
    console.error("Error updating testimonial:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update testimonial" },
      { status: 500 },
    );
  }
}

/** DELETE /api/admin/testimonials/[id] — hapus ulasan (MASTER). */
export async function DELETE(_request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin || !adminCanWrite(admin)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const { id } = await params;
    await prisma.testimonial.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete testimonial" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
