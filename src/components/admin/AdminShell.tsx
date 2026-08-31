"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Avatar,
  Breadcrumb,
  Button,
  Drawer,
  Grid,
  Layout,
  Menu,
  Space,
  theme,
} from "antd";
import {
  BankOutlined,
  DashboardOutlined,
  FileTextOutlined,
  FundViewOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
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

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  const pathname = usePathname();
  const router = useRouter();
  const { token } = theme.useToken();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  // Pilih match terpanjang agar "/admin" (dashboard) tidak menang atas
  // rute turunan seperti "/admin/account" (bug menu selalu di dashboard).
  const selectedKey =
    [...menuItems]
      .sort((a, b) => b.key.length - a.key.length)
      .find(
        (item) => pathname === item.key || pathname.startsWith(`${item.key}/`),
      )?.key ?? "/admin";

  const breadcrumbItems = [
    { title: t("admin.title") },
    {
      title: t(
        menuItems.find((item) => item.key === selectedKey)?.localeKey ??
          "admin.dashboard",
      ),
    },
  ];

  const menuNode = (mode: "inline") => (
    <Menu
      mode={mode}
      selectedKeys={[selectedKey]}
      style={{ borderInlineEnd: "none" }}
      onClick={({ key }) => {
        router.push(key);
        setMobileOpen(false);
      }}
      items={menuItems.map((item) => ({
        key: item.key,
        icon: item.icon,
        label: t(item.localeKey),
      }))}
    />
  );

  const brand = (
    <div className="flex h-16 items-center gap-2 px-4">
      <span className="truncate text-base font-bold">Desaku Wisataku</span>
    </div>
  );

  return (
    <Layout hasSider style={{ minHeight: "100vh" }}>
      {isMobile ? (
        // Mobile/tablet: menu dalam drawer (dibuka dari header).
        <Drawer
          placement="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          styles={{ body: { padding: 0 } }}
        >
          {brand}
          {menuNode("inline")}
        </Drawer>
      ) : (
        // Desktop: sider sticky + collapsible.
        <Sider
          collapsed={collapsed}
          width={220}
          collapsedWidth={64}
          theme="light"
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            alignSelf: "flex-start",
            overflow: "auto",
            borderRight: `1px solid ${token.colorBorderSecondary}`,
          }}
          trigger={
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ width: "100%" }}
              aria-label="Toggle sidebar"
            />
          }
        >
          {brand}
          {menuNode("inline")}
        </Sider>
      )}

      <Layout
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
          position: "relative",
        }}
      >
        <Header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            height: "auto",
            paddingBlock: 12,
            paddingInline: isMobile ? 16 : 24,
            lineHeight: "normal",
            // bg mengikuti tema (bukan default gelap Header antd).
            backgroundColor: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Space size="small">
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              />
            )}
            <Breadcrumb style={{ fontWeight: 600 }} items={breadcrumbItems} />
          </Space>
          <Space size="middle">
            <LanguageToggle />
            <ThemeToggle />
            <Link href="/admin/profile">
              <Avatar
                style={{ backgroundColor: token.colorPrimary }}
                icon={<UserOutlined />}
              />
            </Link>
            <Link href="/">
              <Button
                type="text"
                icon={<LogoutOutlined />}
                aria-label="Back to site"
              />
            </Link>
          </Space>
        </Header>

        <Content
          style={{
            padding: isMobile ? 16 : 24,
            background: "none",
            display: "flex",
            flexGrow: 1,
            flexDirection: "column",
            width: "100%",
            minWidth: 0,
            gap: 24,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
