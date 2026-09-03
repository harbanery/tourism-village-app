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
}

/**
 * Paket aktif untuk pengunjung web: hanya paket ACTIVE yang tempatnya
 * juga ACTIVE (atau tanpa tempat) yang ditampilkan, sehingga selalu
 * sesuai data admin.
 */
export async function getActivePackages(): Promise<ActivePackage[]> {
  const packages = await prisma.package.findMany({
    where: { status: "ACTIVE" },
    orderBy: { id: "asc" },
    include: { place: { select: { id: true, name: true, status: true } } },
  });

  return packages
    .filter((pkg) => pkg.placeId === null || pkg.place?.status === "ACTIVE")
    .map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      placeId: pkg.placeId,
      placeName: pkg.place?.name ?? null,
      facilities: pkg.facilities,
      price: pkg.price,
    }));
}
