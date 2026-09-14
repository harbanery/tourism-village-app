import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { verifyPageTicket } from "@/lib/otp";
import { onReviewPending } from "@/utils/server/orderEvents";

/** Jeda minimal antar ulasan per user (24 jam). */
const REVIEW_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/** Batas panjang komentar ulasan (rekomendasi 2.2). */
export const REVIEW_MIN_LENGTH = 10;
export const REVIEW_MAX_LENGTH = 500;

/**
 * Kata kasar yang ditolak sebelum masuk antrean moderasi (rekomendasi
 * 2.2 — filter ringan id/en; moderasi admin tetap menjadi lapis utama).
 * Dicocokkan pada teks ternormalisasi (huruf kecil, non-alfanumerik →
 * spasi) dengan batas kata agar tidak mengenai substring kata baik.
 */
const PROFANITY_WORDS: string[] = [
  // Indonesia
  "anjing",
  "bangsat",
  "bajingan",
  "babi",
  "kontol",
  "memek",
  "ngentot",
  "jembut",
  "goblok",
  "tolol",
  "brengsek",
  "bangke",
  // Inggris
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "cunt",
  "dick",
  "pussy",
];

/** true bila komentar mengandung kata kasar (word-boundary). */
function containsProfanity(comment: string): boolean {
  const normalized = comment
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
  return PROFANITY_WORDS.some(
    (word) =>
      new RegExp(`(^|\\s)${word}(\\s|$)`).test(normalized),
  );
}

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

  // Token ulasan sekali pakai (rekomendasi 2.3): diterbitkan server saat
  // status pembayaran PAID; dikonsumsi penuh di sini — ulasan hanya bisa
  // dikirim dari halaman yang dibuka setelah pembayaran berhasil.
  const reviewTicket = request.headers.get("x-review-ticket") ?? "";
  const ticketOk = await verifyPageTicket(reviewTicket, user.id, "ORDER_REVIEW", {
    consume: true,
  });
  if (!ticketOk) {
    return NextResponse.json(
      { success: false, error: "REVIEW_TICKET_REQUIRED" },
      { status: 403 },
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

  // Batas panjang + kata kasar (rekomendasi 2.2).
  if (comment.length < REVIEW_MIN_LENGTH) {
    return NextResponse.json(
      { success: false, error: "REVIEW_TOO_SHORT" },
      { status: 400 },
    );
  }
  if (comment.length > REVIEW_MAX_LENGTH) {
    return NextResponse.json(
      { success: false, error: "REVIEW_TOO_LONG" },
      { status: 400 },
    );
  }
  if (containsProfanity(comment)) {
    return NextResponse.json(
      { success: false, error: "REVIEW_PROFANITY" },
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
      // NONACTIVE: tampil publik hanya setelah disetujui admin
      // (rekomendasi 2.2 — moderasi, bukan tayang instan).
      status: "NONACTIVE",
    },
  });
  // Belum tayang publik → cache ulasan TIDAK perlu disegarkan; segarkan
  // saat admin menyetujui (lihat PATCH /api/admin/testimonials/[id]).

  // Notifikasi admin: ulasan baru menunggu moderasi (best-effort).
  void onReviewPending(user.name, rating);

  return NextResponse.json(
    { success: true, data: { id: testimonial.id } },
    { status: 201 },
  );
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
