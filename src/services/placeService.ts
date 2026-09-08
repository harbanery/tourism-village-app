import prisma from "@/server/db";

/**
 * Service layer untuk akses data tempat wisata (pola progress-self:
 * service berinteraksi langsung dengan Prisma, dipanggil oleh route
 * handler / server component).
 */

/** Paket aktif di dalam tempat wisata (untuk halaman wisata web). */
export interface PlacePackage {
  id: string;
  name: string;
  facilities: string[];
  price: number;
}

/** DTO tempat wisata aktif + paketnya untuk pengunjung web. */
export interface PlaceWithPackages {
  id: string;
  name: string;
  description: string | null;
  photo: string | null;
  /** Total kuantitas terjual lunas dari semua paket tempat ini. */
  totalPurchased: number;
  packages: PlacePackage[];
}

/**
 * Tempat wisata aktif beserta paket aktifnya (hanya paket pada tempat
 * ACTIVE yang ikut). `totalPurchased` = jumlah kuantitas terjual (order
 * PAID) dari semua paket tempat ini — dasar urutan "wisata populer" di
 * halaman depan (sesuai semantik tag Populer di admin: tempat dianggap
 * populer bila punya paket yang pernah dibayar).
 */
export async function getPlacesWithPackages(): Promise<PlaceWithPackages[]> {
  const [places, purchaseCounts] = await Promise.all([
    prisma.place.findMany({
      where: { status: "ACTIVE" },
      orderBy: { id: "asc" },
      include: {
        packages: {
          where: { status: "ACTIVE" },
          orderBy: { id: "asc" },
          select: { id: true, name: true, facilities: true, price: true },
        },
      },
    }),
    prisma.orderItem.groupBy({
      by: ["packageId"],
      where: {
        order: { paymentStatus: "PAID" },
        package: { status: "ACTIVE" },
      },
      _sum: { quantity: true },
    }),
  ]);

  const countByPackage = new Map(
    purchaseCounts.map((row) => [row.packageId, row._sum.quantity ?? 0]),
  );

  return places.map((place) => ({
    id: place.id,
    name: place.name,
    description: place.description,
    photo: place.photo,
    totalPurchased: place.packages.reduce(
      (sum, pkg) => sum + (countByPackage.get(pkg.id) ?? 0),
      0,
    ),
    packages: place.packages,
  }));
}
