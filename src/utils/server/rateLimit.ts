/**
 * Rate limiter in-memory dengan sliding window per key (rekomendasi 2.1).
 *
 * Dipakai endpoint ringan yang butuh proteksi abuse tanpa membebani DB
 * (mis. pay/status order). Catatan: state per-instance — di serverless
 * multi-instance perlindungan ini berlaku per lambda (masih menahan
 * sebagian besar burst); login/register tetap memakai limiter DB
 * (LoginAttempt) yang persisten.
 */

const buckets = new Map<string, number[]>();

/** Batas atas jumlah key — housekeeping agar map tidak membengkak. */
const MAX_KEYS = 10_000;

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
