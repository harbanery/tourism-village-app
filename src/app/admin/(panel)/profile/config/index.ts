import { FormLayout } from "@/models/form";

/**
 * Form profil admin — hanya avatar dan nama yang bisa diedit;
 * email & role ditampilkan read-only di decorator.
 */
export const profileFormLayout: FormLayout[] = [
  {
    key: "main",
    items: [
      { name: "avatar", type: "upload", required: false },
      { name: "name", type: "input", required: false, maxLength: 100 },
    ],
  },
];
