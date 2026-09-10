import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitasi rich text (rekomendasi 2.2): konten HTML dari editor blog
 * dibersihkan di SERVER sebelum disimpan — tag/atribut berbahaya
 * (script, event handler onclick/…, javascript: URI, iframe, form,
 * dsb.) dibuang sehingga aman dirender via dangerouslySetInnerHTML.
 */

const FORBID_TAGS = ["style", "iframe", "form", "input", "object", "embed"];

export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, { FORBID_TAGS });
}
