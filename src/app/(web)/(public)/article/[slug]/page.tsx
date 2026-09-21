import type { Metadata } from "next";
import { getActiveBlogBySlug } from "@/services/blog";
import { displayImage } from "@/utils/helpers";
import { META_APP, META_TITLE } from "@/utils/config/variables";
import { ArticleDetailSection } from "./section/ArticleDetailSection";

/** Merek suffix metadata — sama dengan template title root layout. */
const BRAND = META_TITLE ?? META_APP ?? "DesakuWisataku";

/**
 * ISR: detail artikel diambil di server (service) dan diverifikasi
 * tiap 60 detik — konten sudah termuat saat HTML dirender (SSR).
 */
export const revalidate = 60;

/**
 * Meta per artikel (rekomendasi 1.2): judul, ringkasan, OG image.
 * Judul dokumen otomatis menjadi "judul artikel | DesakuWisataku"
 * lewat title.template root layout; openGraph.title TIDAK mewarisi
 * template sehingga suffix merek ditulis eksplisit (permintaan DROID),
 * dan OG type memakai "article".
 */
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

  // OG title lengkap dengan merek (template tidak berlaku di OG).
  const ogTitle = `${post.title} | ${BRAND}`;

  return {
    title: post.title,
    description: excerpt,
    openGraph: {
      title: ogTitle,
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
