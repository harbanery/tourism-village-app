import { getActiveBlogBySlug } from "@/services/blog";
import { ArticleDetailSection } from "./section/ArticleDetailSection";

/**
 * ISR: detail artikel diambil di server (service) dan diverifikasi
 * tiap 60 detik — konten sudah termuat saat HTML dirender (SSR).
 */
export const revalidate = 60;

/** Detail artikel dari DB (hanya blog aktif). */
export default async function ArticleDetailPage({
  params,
}: PageProps<"/article/[slug]">) {
  const { slug } = await params;
  const post = await getActiveBlogBySlug(slug);

  return <ArticleDetailSection post={post} />;
}
