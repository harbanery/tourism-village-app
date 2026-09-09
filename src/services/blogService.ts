import { unstable_cache } from "next/cache";
import prisma from "@/server/db";

/**
 * Service layer untuk akses data blog/artikel (pola progress-self:
 * service berinteraksi langsung dengan Prisma, dipanggil oleh route
 * handler / server component halaman web).
 */

/** DTO blog aktif untuk halaman artikel web. */
export interface WebBlog {
  id: string;
  slug: string;
  title: string;
  filename: string;
  /** Gabungan paragraf rich text (pembuka + isi). */
  para: string;
  datetime: string;
  datetimeAfter: string | null;
  adminName: string | null;
}

/** DTO detail blog aktif untuk halaman detail artikel. */
export interface WebBlogDetail {
  title: string;
  filename: string;
  para: string;
  datetime: string;
  datetimeAfter: string | null;
  adminName: string | null;
}

/**
 * Daftar blog aktif — dibungkus unstable_cache (caching data public).
 * Tag "blogs" di-invalidate dari panel admin saat blog dibuat/diubah/
 * di-nonaktifkan; revalidate 60 detik sebagai fallback penyegaran.
 */
const getCachedBlogs = unstable_cache(
  async (): Promise<WebBlog[]> => {
    const blogs = await prisma.blog.findMany({
      where: { status: "ACTIVE" },
      orderBy: { datetime: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        filename: true,
        para: true,
        datetime: true,
        datetimeAfter: true,
        admin: { select: { name: true } },
      },
    });
    // Ratakan relasi admin → adminName (bentuk data yang dipakai web).
    return blogs.map(({ admin, ...blog }) => ({
      ...blog,
      datetime: blog.datetime.toISOString(),
      datetimeAfter: blog.datetimeAfter?.toISOString() ?? null,
      adminName: admin?.name ?? null,
    }));
  },
  ["web-active-blogs"],
  { tags: ["blogs"], revalidate: 60 },
);

/** Blog aktif untuk halaman artikel web (dipakai halaman SSR & API). */
export function getActiveBlogs(): Promise<WebBlog[]> {
  return getCachedBlogs();
}

/** Detail satu blog aktif berdasar slug (halaman detail SSR). */
export async function getActiveBlogBySlug(
  slug: string,
): Promise<WebBlogDetail | null> {
  const blog = await prisma.blog.findFirst({
    where: { slug, status: "ACTIVE" },
    select: {
      title: true,
      filename: true,
      para: true,
      datetime: true,
      datetimeAfter: true,
      admin: { select: { name: true } },
    },
  });
  if (!blog) return null;

  return {
    title: blog.title,
    filename: blog.filename,
    para: blog.para,
    datetime: blog.datetime.toISOString(),
    datetimeAfter: blog.datetimeAfter?.toISOString() ?? null,
    adminName: blog.admin.name,
  };
}
