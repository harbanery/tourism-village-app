/**
 * Slug URL kebab-case dari judul (dipakai blog: /blog/[slug]).
 * Non-alfanumerik menjadi "-", di-trim, maksimum 80 karakter.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // buang diakritik (é → e)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}
