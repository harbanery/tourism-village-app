import { NextResponse } from "next/server";
import prisma from "@/server/db";
import { getCurrentUser } from "@/server/auth";

/**
 * POST /api/web/testimonials — kirim ulasan (wajib login).
 * Status awal NONACTIVE: dimoderasi admin lewat menu Ulasan.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  let body: { rating?: number; comment?: string };
  try {
    body = (await request.json()) as { rating?: number; comment?: string };
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const rating = Number(body.rating);
  const comment = (body.comment ?? "").trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment) {
    return NextResponse.json(
      { success: false, error: "INVALID_REVIEW" },
      { status: 400 },
    );
  }

  const testimonial = await prisma.testimonial.create({
    data: {
      userId: user.id,
      rating,
      comment,
      status: "NONACTIVE", // menunggu moderasi admin
    },
  });

  return NextResponse.json(
    { success: true, data: { id: testimonial.id } },
    { status: 201 },
  );
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
