"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Button, Layout, Menu, theme } from "antd";
import {
  BankOutlined,
  FileTextOutlined,
  FundViewOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PictureOutlined,
  ShoppingOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageToggle } from "@/components/locale/LanguageToggle";

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: "/admin/manage-account", icon: <TeamOutlined />, localeKey: "admin.accounts.title" },
  { key: "/admin/manage-tourism", icon: <BankOutlined />, localeKey: "admin.tourism.title" },
  { key: "/admin/manage-gallery", icon: <PictureOutlined />, localeKey: "admin.gallery.title" },
  { key: "/admin/manage-vlog", icon: <VideoCameraOutlined />, localeKey: "admin.vlog.title" },
  { key: "/admin/manage-blog", icon: <FileTextOutlined />, localeKey: "admin.blog.title" },
  { key: "/admin/manage-order", icon: <ShoppingOutlined />, localeKey: "admin.orders.title" },
  { key: "/admin/manage-sponsor", icon: <TrophyOutlined />, localeKey: "admin.sponsors.title" },
  { key: "/admin/manage-review", icon: <FundViewOutlined />, localeKey: "admin.reviews.title" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { token } = theme.useToken();

  const selectedKey =
    menuItems.find((item) => pathname.startsWith(item.key))?.key ?? "/admin/manage-account";

  return (
    <Layout style={{ minHeight: "100dvh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        width={220}
        style={{
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          overflow: "auto",
          height: "100dvh",
          position: "sticky",
          top: 0,
        }}
      >
        <div className="flex items-center gap-2 px-4 h-16">
          <span className="w-8 h-8 shrink-0 rounded-lg bg-[#0d7a5f] text-white grid place-items-center text-sm font-bold">
            DV
          </span>
          {!collapsed && <span className="font-bold truncate">Panel Admin</span>}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: <Link href={item.key}>{t(item.localeKey)}</Link>,
          }))}
        />
      </Sider>
      <Layout>
        <Header
          className="flex items-center justify-between gap-4 px-4 bg-transparent"
          style={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle sidebar"
          />
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Link href="/admin/adminku">
              <Avatar
                style={{ backgroundColor: token.colorPrimary }}
                icon={<UserOutlined />}
              />
            </Link>
            <Link href="/">
              <Button type="text" icon={<LogoutOutlined />} aria-label="Back to site" />
            </Link>
          </div>
        </Header>
        <Content className="p-4 md:p-6">{children}</Content>
      </Layout>
    </Layout>
  );
}
