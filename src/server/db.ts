import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton (pola admin-portfolio).
 * Mencegah pembukaan koneksi baru di setiap hot-reload saat development.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
  client.$connect().catch((err) => {
    console.error("[prisma] gagal koneksi awal:", err);
  });
  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    prisma.$disconnect().catch(() => {});
  });
}

export default prisma;
