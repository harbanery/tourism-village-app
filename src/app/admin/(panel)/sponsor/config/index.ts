import { FormLayout } from "@/models/form";

/** Form sponsor: foto memakai form upload (Cloudinary), status takeout. */
export const sponsorFormLayout: FormLayout[] = [
  {
    key: "main",
    items: [
      { name: "name", type: "input", required: true },
      { name: "description", type: "textarea", required: false },
      { name: "filename", type: "upload", required: true },
    ],
  },
];
