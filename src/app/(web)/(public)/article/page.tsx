import { getActiveBlogs } from "@/services/blogService";
import { ArticleListSection } from "./section/ArticleListSection";

/**
 * ISR: daftar artikel diambil di server (service ter-cache) dan
 * diverifikasi tiap 60 detik — data awal sudah termuat saat render.
 * Pencarian, urutan, arsip, dan infinite scroll tetap berjalan di
 * client atas data awal tersebut (tanpa fetching ulang).
 */
export const revalidate = 60;

export default async function ArticlePage() {
  const posts = await getActiveBlogs();

  return <ArticleListSection posts={posts} />;
}
