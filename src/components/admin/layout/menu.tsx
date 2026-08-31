import {
  BankOutlined,
  DashboardOutlined,
  FileTextOutlined,
  FundViewOutlined,
  PictureOutlined,
  ShoppingOutlined,
  TeamOutlined,
  TrophyOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";

export interface AdminMenuItem {
  /** Rute menu (dipakai juga sebagai key Menu). */
  key: string;
  localeKey: string;
  icon: React.ReactNode;
}

export const adminMenu: AdminMenuItem[] = [
  { key: "/admin", icon: <DashboardOutlined />, localeKey: "admin.dashboard" },
  { key: "/admin/account", icon: <TeamOutlined />, localeKey: "admin.accounts.title" },
  { key: "/admin/tourism", icon: <BankOutlined />, localeKey: "admin.tourism.title" },
  { key: "/admin/gallery", icon: <PictureOutlined />, localeKey: "admin.gallery.title" },
  { key: "/admin/vlog", icon: <VideoCameraOutlined />, localeKey: "admin.vlog.title" },
  { key: "/admin/blog", icon: <FileTextOutlined />, localeKey: "admin.blog.title" },
  { key: "/admin/order", icon: <ShoppingOutlined />, localeKey: "admin.orders.title" },
  { key: "/admin/sponsor", icon: <TrophyOutlined />, localeKey: "admin.sponsors.title" },
  { key: "/admin/review", icon: <FundViewOutlined />, localeKey: "admin.reviews.title" },
];

/** Cari item menu untuk pathname (match terpanjang menang). */
export function matchMenu(pathname: string): AdminMenuItem | undefined {
  return [...adminMenu]
    .sort((a, b) => b.key.length - a.key.length)
    .find((item) => pathname === item.key || pathname.startsWith(`${item.key}/`));
}
