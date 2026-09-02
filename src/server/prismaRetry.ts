import { prisma } from "@/server/db";

/**
 * Utility untuk menjalankan operasi Prisma dengan retry otomatis.
 *
 * Menangani transient error seperti "Server has closed the connection"
 * (P1001/P1002/P1017) yang sering muncul saat hot-reload di development,
 * serta P1021 (pool habis) dan P2028 (transaksi interaktif kedaluwarsa —
 * umum pada database remote mis. Railway yang latensinya tinggi dari
 * jaringan lokal). Pada error tersebut, koneksi di-reconnect ($connect)
 * lalu operasi diulang beberapa kali sebelum menyerah.
 *
 * Catatan keamanan retry P2028: transaksi interaktif yang expired di-
 * rollback oleh Prisma (tidak pernah commit parsial), sehingga aman
 * dijalankan ulang dari awal.
 */

const RETRYABLE_PRISMA_CODES = new Set([
  "P1001", // Can't reach database server
  "P1002", // Server has closed the connection
  "P1017", // Server has closed the connection
  "P1021", // Timed out fetching connection from pool
  "P2028", // Transaction already closed (interactive timeout)
]);

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 300;

/**
 * Opsi transaksi interaktif yang toleran terhadap latensi database remote.
 * Default Prisma (timeout 5s) terlalu ketat bila server jauh dari klien.
 */
export const REMOTE_TX_OPTIONS = {
  /** Maksimal durasi transaksi berjalan. */
  timeout: 30_000,
  /** Maksimal waktu menunggu koneksi dari pool (connection_limit=5). */
  maxWait: 10_000,
} as const;

function isTransientError(err: unknown): boolean {
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code?: string }).code;
    return RETRYABLE_PRISMA_CODES.has(code ?? "");
  }
  // Fallback: cek pesan untuk error tanpa kode (mis. network drop).
  const message =
    err instanceof Error ? err.message : String(err);
  return /closed the connection|can't reach|timed out|transaction already closed/i.test(message);
}

/**
 * Eksekusi `operation` dengan retry pada transient connection error.
 * Sebelum retry, koneksi Prisma di-reconnect terlebih dahulu.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  attempts = MAX_ATTEMPTS,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      if (!isTransientError(err) || attempt === attempts) {
        throw err;
      }
      // Reconnect sebelum mencoba lagi.
      try {
        await prisma.$connect();
      } catch {
        // ignore; error reconnect akan tertangkap di iterasi berikutnya
      }
      const delay = BASE_DELAY_MS * attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
