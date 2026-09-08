import { FormLayout } from "@/models/form";

/** Form sponsor: foto memakai form upload (Cloudinary), status takeout.
 * invertDark: logo berwarna gelap dibalik jadi putih di dark mode web. */
export const sponsorFormLayout: FormLayout[] = [
  {
    key: "main",
    items: [
      { name: "name", type: "input", required: true },
      { name: "description", type: "textarea", required: false },
      { name: "filename", type: "upload", required: true },
      { name: "invertDark", type: "switch", required: false },
    ],
  },
];
