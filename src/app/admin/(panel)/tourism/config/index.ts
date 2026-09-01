import { FormLayout } from "@/models/form";

/**
 * Form tempat wisata:
 * - foto memakai form upload (Cloudinary)
 * - form status takeout (status hanya via kolom opsi)
 */
export const placeFormLayout: FormLayout[] = [
  {
    key: "main",
    items: [
      { name: "name", type: "input", required: true },
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
