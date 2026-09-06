import { FormLayout } from "@/models/form";

/**
 * Form blog (urutan): judul, slug, deskripsi (paragraf), foto, tempat wisata.
 * - slug auto-generate kebab-case dari judul (bisa diisi sendiri)
 * - foto memakai form upload (Cloudinary)
 * - paragraf memakai text editor (react-quill-new)
 * - tempat wisata terkait optional
 */
export const blogFormLayout: FormLayout[] = [
  {
    key: "main",
    items: [
      { name: "title", type: "input", required: true },
      { name: "slug", type: "input", required: false },
      { name: "para", type: "editor", required: true },
      { name: "filename", type: "upload", required: true },
      { name: "placeId", type: "select", required: false },
    ],
  },
];
