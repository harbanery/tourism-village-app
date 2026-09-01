import { FormLayout } from "@/models/form";

/**
 * Form blog:
 * - foto memakai form upload (Cloudinary)
 * - paragraf pembuka + isi digabung menjadi satu form paragraf
 *   dengan text editor (react-quill-new)
 */
export const blogFormLayout: FormLayout[] = [
  {
    key: "main",
    items: [
      { name: "title", type: "input", required: true },
      { name: "filename", type: "upload", required: true },
      { name: "para", type: "editor", required: true },
    ],
  },
];
