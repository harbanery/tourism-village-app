import { FormLayout } from "@/models/form";

/** Form tambah admin (MASTER saja). Password digenerate server-side. */
export const adminFormLayout: FormLayout[] = [
  {
    key: "main",
    items: [
      {
        name: "username",
        type: "input",
        required: true,
        icon: "UserOutlined",
      },
      {
        name: "email",
        type: "input",
        required: true,
        icon: "MailOutlined",
      },
      {
        name: "name",
        type: "input",
        required: false,
      },
      {
        name: "role",
        type: "select",
        required: true,
      },
    ],
  },
];

/** Form ubah admin — hanya role yang bisa diubah. */
export const adminRoleFormLayout: FormLayout[] = [
  {
    key: "role",
    items: [
      {
        name: "role",
        type: "select",
        required: true,
      },
    ],
  },
];
