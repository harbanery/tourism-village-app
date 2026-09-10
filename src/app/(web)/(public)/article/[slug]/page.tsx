import type { Metadata } from "next";
import { getActiveBlogBySlug } from "@/services/blog";
import { displayImage } from "@/utils/helpers";
import { ArticleDetailSection } from "./section/ArticleDetailSection";

/**
 * ISR: detail artikel diambil di server (service) dan diverifikasi
 * tiap 60 detik — konten sudah termuat saat HTML dirender (SSR).
 */
export const revalidate = 60;

/** Meta per artikel (rekomendasi 1.2): judul, ringkasan, OG image. */
export async function generateMetadata({
  params,
}: PageProps<"/article/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getActiveBlogBySlug(slug);
  if (!post) return {};

  // Ringkasan teks polos dari rich text (maks 155 karakter).
  const excerpt =
    post.para
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 155) || post.title;

  return {
    title: post.title,
    description: excerpt,
    openGraph: {
      title: post.title,
      description: excerpt,
      type: "article",
      publishedTime: post.datetime,
      images: [displayImage(post.filename, 960).src],
    },
  };
}

/** Detail artikel dari DB (hanya blog aktif). */
export default async function ArticleDetailPage({
  params,
}: PageProps<"/article/[slug]">) {
  const { slug } = await params;
  const post = await getActiveBlogBySlug(slug);

  return <ArticleDetailSection post={post} />;
}
