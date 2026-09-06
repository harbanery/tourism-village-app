import prisma from "@/server/db";
import { slugify } from "@/helpers/slug";

/**
 * Slug blog unik: pakai slug dasar; bila sudah dipakai blog lain,
 * tambahkan suffix -2, -3, dst. (excludeId = blog yang sedang diupdate).
 */
export async function uniqueBlogSlug(
  base: string,
  excludeId?: string,
): Promise<string> {
  let slug = base;
  let suffix = 2;
  for (;;) {
    const clash = await prisma.blog.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (!clash) return slug;
    slug = `${base}-${suffix++}`;
  }
}

/** Slug bersih dari input form (atau judul bila kosong). */
export function blogSlugBase(
  slug: unknown,
  title: string,
): string {
  return slugify(
    typeof slug === "string" && slug.trim() ? slug : (title ?? ""),
  );
}
