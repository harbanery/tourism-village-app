import type { AdminRole } from "@prisma/client";

/** Daftar key menu admin (galeri & vlog takeout sementara). */
export const menuKeys = [
  "dashboard",
  "account",
  "tourism",
  "blog",
  "order",
  "sponsor",
  "review",
] as const;

export type MenuKey = (typeof menuKeys)[number];

export interface AdminMenuItem {
  key: MenuKey;
  link: string;
  icon: string;
  /** Role yang boleh melihat menu ini. */
  roles: AdminRole[];
}

/** Menu sider admin — role: MASTER semua, VIEWER lihat semua, AUTHOR blog saja. */
export const menuAdminConfig: AdminMenuItem[] = [
  {
    key: "dashboard",
    link: "/admin",
    icon: "DashboardOutlined",
    roles: ["MASTER", "VIEWER", "AUTHOR"],
  },
  {
    key: "account",
    link: "/admin/account",
    icon: "TeamOutlined",
    roles: ["MASTER", "VIEWER"],
  },
  {
    key: "tourism",
    link: "/admin/tourism",
    icon: "BankOutlined",
    roles: ["MASTER", "VIEWER"],
  },
  {
    key: "blog",
    link: "/admin/blog",
    icon: "FileTextOutlined",
    roles: ["MASTER", "VIEWER", "AUTHOR"],
  },
  {
    key: "order",
    link: "/admin/order",
    icon: "ShoppingOutlined",
    roles: ["MASTER", "VIEWER"],
  },
  {
    key: "sponsor",
    link: "/admin/sponsor",
    icon: "TrophyOutlined",
    roles: ["MASTER", "VIEWER"],
  },
  {
    key: "review",
    link: "/admin/review",
    icon: "FundViewOutlined",
    roles: ["MASTER", "VIEWER"],
  },
];

/** Daftar role admin untuk select form. */
export const adminRoleOptions = [
  { value: "MASTER", label: "Master" },
  { value: "VIEWER", label: "Viewer" },
  { value: "AUTHOR", label: "Author" },
] as const;

/** Opsi fasilitas paket wisata (multiple select). */
export const facilityOptions = [
  "Jasa Pemandu",
  "Peralatan",
  "Asuransi",
  "Transportasi",
];
