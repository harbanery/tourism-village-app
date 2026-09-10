import { revalidateTag } from "next/cache";

/**
 * Invalidasi cache data public (rekomendasi 1.2): dipanggil dari panel
 * admin saat data yang tampil di web berubah. Tag mengikuti yang
 * dipakai unstable_cache di service/route public:
 * - places: tempat wisata (+ statistik populer)
 * - packages: paket wisata (+ statistik populer)
 * - blogs: artikel/blog
 * - videos: video dokumentasi
 * - testimonials: ulasan publik
 * - sponsors: logo sponsor
 * - orders: agregat pembelian PAID (populer)
 */
export function revalidatePublicCache(tags: string[]): void {
  for (const tag of tags) {
    try {
      // Profil "max": konten lama boleh disajikan selama proses revalidasi
      // (bentuk satu argumen revalidateTag deprecated di Next 16).
      revalidateTag(tag, "max");
    } catch (error) {
      // Invalidasi best-effort — jangan gagalkan aksi utamanya.
      console.error(`Error revalidating tag "${tag}":`, error);
    }
  }
}
