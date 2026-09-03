import prisma from "@/server/db";

/**
 * Service layer untuk akses data paket wisata (pola progress-self:
 * service berinteraksi langsung dengan Prisma, dipanggil oleh route
 * handler / server component).
 */

/** DTO paket aktif untuk halaman web. */
export interface ActivePackage {
  id: number;
  name: string;
  placeId: number | null;
  placeName: string | null;
  facilities: string[];
  price: number;
  /** Berapa kali paket ini berhasil dibayar (untuk "sering dibeli"). */
  timesPurchased: number;
}

/**
 * Paket aktif untuk pengunjung web: hanya paket ACTIVE yang tempatnya
 * juga ACTIVE (atau tanpa tempat) yang ditampilkan, sehingga selalu
 * sesuai data admin. `timesPurchased` dihitung dari order item berstatus
 * PAID (transaksi nyata, bukan sekadar draft PENDING).
 */
export async function getActivePackages(): Promise<ActivePackage[]> {
  const [packages, purchaseCounts] = await Promise.all([
    prisma.package.findMany({
      where: { status: "ACTIVE" },
      orderBy: { id: "asc" },
      include: { place: { select: { id: true, name: true, status: true } } },
    }),
    prisma.orderItem.groupBy({
      by: ["packageId"],
      where: { order: { paymentStatus: "PAID" } },
      _sum: { quantity: true },
    }),
  ]);

  const countByPackage = new Map(
    purchaseCounts.map((row) => [row.packageId, row._sum.quantity ?? 0]),
  );

  return packages
    .filter((pkg) => pkg.placeId === null || pkg.place?.status === "ACTIVE")
    .map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      placeId: pkg.placeId,
      placeName: pkg.place?.name ?? null,
      facilities: pkg.facilities,
      price: pkg.price,
      timesPurchased: countByPackage.get(pkg.id) ?? 0,
    }));
}
