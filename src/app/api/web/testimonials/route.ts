import { NextResponse } from "next/server";
import prisma from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { onReviewPending } from "@/server/orderEvents";

/** Jeda minimal antar ulasan per user (24 jam). */
const REVIEW_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/**
 * GET /api/web/testimonials — status ulasan user login:
 * - canReview: boleh mengirim ulasan sekarang (belum ada dalam 24 jam terakhir).
 * - lastReviewAt: waktu ulasan terakhir (fallback tampilan countdown klien).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const last = await prisma.testimonial.findFirst({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    select: { date: true },
  });

  const cooldownEnd =
    last && last.date.getTime() + REVIEW_COOLDOWN_MS > Date.now()
      ? new Date(last.date.getTime() + REVIEW_COOLDOWN_MS).toISOString()
      : null;

  return NextResponse.json({
    success: true,
    data: { canReview: cooldownEnd === null, cooldownEnd },
  });
}

/**
 * POST /api/web/testimonials — kirim ulasan (wajib login).
 * Rate limit: 1 ulasan per 24 jam per user — setelah berhasil, user harus
 * menunggu 24 jam untuk bisa mengirim lagi.
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

  // Rate limit: ulasan dalam 24 jam terakhir → tolak (harus menunggu).
  const last = await prisma.testimonial.findFirst({
    where: {
      userId: user.id,
      date: { gte: new Date(Date.now() - REVIEW_COOLDOWN_MS) },
    },
    select: { id: true },
  });
  if (last) {
    return NextResponse.json(
      { success: false, error: "REVIEW_COOLDOWN" },
      { status: 429 },
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

  // Notifikasi admin: ulasan baru menunggu moderasi (best-effort).
  void onReviewPending(user.name, rating);

  return NextResponse.json(
    { success: true, data: { id: testimonial.id } },
    { status: 201 },
  );
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
