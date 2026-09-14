import { safeEqual } from "@/lib/auth";
import { CRON_SECRET } from "@/utils/config/variables";

/**
 * Proteksi endpoint /api/cron/* (rekomendasi 2.6).
 *
 * Sebelumnya token dibandingkan dengan `!==` biasa, dan CRON_SECRET
 * default-nya string kosong — header `"Bearer "` (kosong) bisa lolos bila
 * env lupa diset di produksi. Sekarang:
 * - secret kosong → tolak SEMUA request (fail-closed);
 * - perbandingan token konstan-waktu (timingSafeEqual via safeEqual).
 */
export function isCronAuthorized(request: Request): boolean {
  if (!CRON_SECRET) return false;
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  return safeEqual(token, CRON_SECRET);
}
