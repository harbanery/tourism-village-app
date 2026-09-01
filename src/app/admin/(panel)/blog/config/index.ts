import { FormLayout } from "@/models/form";

/**
 * Form blog (urutan): judul, deskripsi (paragraf), foto, tempat wisata.
 * - foto memakai form upload (Cloudinary)
 * - paragraf memakai text editor (react-quill-new)
 * - tempat wisata terkait optional
 */
export const blogFormLayout: FormLayout[] = [
  {
    key: "main",
    items: [
      { name: "title", type: "input", required: true },
      { name: "para", type: "editor", required: true },
      { name: "filename", type: "upload", required: true },
      { name: "placeId", type: "select", required: false },
    ],
  },
];
