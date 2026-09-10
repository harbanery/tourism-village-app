import { FormLayout } from "@/features/admin/types";

/**
 * Form tempat wisata:
 * - foto memakai form upload (Cloudinary)
 * - deskripsi opsional (textarea) — tampil di expanded row tabel
 * - form status takeout (status hanya via kolom opsi)
 */
export const placeFormLayout: FormLayout[] = [
  {
    key: "main",
    items: [
      { name: "name", type: "input", required: true },
      {
        name: "description",
        type: "textarea",
        required: false,
        maxLength: 500,
      },
      { name: "photo", type: "upload", required: true },
    ],
  },
];

/** Form paket: fasilitas memakai multiple select. */
export const packageFormLayout: FormLayout[] = [
  {
    key: "main",
    items: [
      { name: "name", type: "input", required: true },
      { name: "placeId", type: "select", required: true },
      { name: "facilities", type: "select_multiple", required: true },
      { name: "price", type: "number", required: true },
    ],
  },
];
