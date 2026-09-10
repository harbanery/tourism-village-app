import type { MetadataRoute } from "next";
import { BASE_URL } from "@/utils/config/variables";
import { getActiveBlogs } from "@/services/blog";

/**
 * Sitemap dinamis (rekomendasi 1.2): halaman publik statis + seluruh
 * slug artikel aktif (dari cache getActiveBlogs).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/tourism`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/article`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/documentation`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/user-agreement`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const blogs = await getActiveBlogs();
    blogRoutes = blogs.map((blog) => ({
      url: `${BASE_URL}/article/${blog.slug}`,
      lastModified: blog.datetimeAfter ?? blog.datetime,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    // Sitemap best-effort — jangan gagalkan build bila DB tak terjangkau.
  }

  return [...staticRoutes, ...blogRoutes];
}
