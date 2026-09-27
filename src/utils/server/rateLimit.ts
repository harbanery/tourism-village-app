/**
 * Rate limiter dengan sliding window per key (rekomendasi 2.1).
 *
 * Dua lapis:
 * - `rateLimit` — in-memory, tanpa DB: cepat, tetapi state per-instance
 *   (di serverless multi-instance window hanya berlaku per lambda).
 * - `rateLimitShared` — sliding window persisten di tabel `RateLimitHit`
 *   (pola `LoginAttempt`): berlaku lintas instance. Dipakai endpoint yang
 *   memanggil API eksternal (pay/status/ticket order — Midtrans). Bila DB
 *   tidak tersedia, otomatis fallback ke limiter in-memory agar endpoint
 *   tetap terlindungi.
 */

import prisma from "@/lib/prisma";

const buckets = new Map<string, number[]>();

/** Batas atas jumlah key — housekeeping agar map tidak membengkak. */
const MAX_KEYS = 10_000;

/**
 * Retensi hit di DB (jam). Window terpanjang yang dipakai aplikasi jauh di
 * bawah ini; baris lebih tua dari retensi dihapus berkala (probabilistik).
 */
const HIT_RETENTION_HOURS = 24;

/** Peluang tiap hit menjalankan sweep pembersihan baris kedaluwarsa. */
const CLEANUP_PROBABILITY = 0.02;

export interface RateLimitResult {
  allowed: boolean;
  /** Milidetik hingga slot pertama window kosong kembali (0 saat allowed). */
  retryAfterMs: number;
}

/**
 * Catat 1 hit dan cek apakah masih di bawah `limit` dalam `windowMs`.
 * Hit lama didrop dari window (sliding window murni, bukan fixed window).
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { allowed: false, retryAfterMs: hits[0] + windowMs - now };
  }

  hits.push(now);
  buckets.set(key, hits);

  if (buckets.size > MAX_KEYS) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }

  return { allowed: true, retryAfterMs: 0 };
}

/**
 * Sliding window persisten di DB — window dihitung dari hit yang tercatat
 * di `RateLimitHit`, sehingga berlaku untuk SEMUA instance serverless,
 * bukan per-instance (rekomendasi security: rate limit in-memory
 * per-instance → penyimpanan bersama). Bila DB error, fallback ke
 * `rateLimit` in-memory supaya endpoint tidak pernah tanpa proteksi.
 */
export async function rateLimitShared(
  key: string,
  limit: number,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  const now = Date.now();

  try {
    const since = new Date(now - windowMs);
    const hits = await prisma.rateLimitHit.findMany({
      where: { key, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });

    if (hits.length >= limit) {
      return {
        allowed: false,
        retryAfterMs: Math.max(
          1,
          hits[0].createdAt.getTime() + windowMs - now,
        ),
      };
    }

    await prisma.rateLimitHit.create({ data: { key } });

    // Sweep probabilistik: hapus hit yang lebih tua dari retensi agar
    // tabel tidak tumbuh tanpa batas (tidak memblokir request ini).
    if (Math.random() < CLEANUP_PROBABILITY) {
      const cutoff = new Date(now - HIT_RETENTION_HOURS * 60 * 60 * 1000);
      void prisma.rateLimitHit
        .deleteMany({ where: { createdAt: { lt: cutoff } } })
        .catch(() => undefined);
    }

    return { allowed: true, retryAfterMs: 0 };
  } catch {
    // DB tidak tersedia → lapis in-memory tetap menahan burst.
    return rateLimit(key, limit, windowMs);
  }
}

/** Respons 429 standar dengan header Retry-After (detik, min 1). */
export function tooManyRequests(retryAfterMs: number): Response {
  return new Response(
    JSON.stringify({ success: false, error: "Too many requests" }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.max(1, Math.ceil(retryAfterMs / 1000))),
      },
    },
  );
}
