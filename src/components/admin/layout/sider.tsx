"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button, Drawer, Grid, Layout, Menu, theme } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { adminMenu, matchMenu } from "./menu";

const { Sider } = Layout;

interface SiderLayoutProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const SiderLayout: React.FC<SiderLayoutProps> = ({
  mobileOpen,
  onMobileClose,
}) => {
  const { t } = useT();
  const pathname = usePathname();
  const router = useRouter();
  const { token } = theme.useToken();

  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const [collapsed, setCollapsed] = useState(false);

  // Match terpanjang agar "/admin" (dashboard) tidak menang atas
  // rute turunan seperti "/admin/account".
  const selectedKey = useMemo(
    () => matchMenu(pathname)?.key ?? "/admin",
    [pathname],
  );

  const menuItems = adminMenu.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: t(item.localeKey),
  }));

  const toggleMenu = ({ key }: { key: string }) => {
    router.push(key);
    onMobileClose();
  };

  const brand = (
    <div className="flex h-16 shrink-0 items-center gap-2 px-4">
      <span className="truncate text-base font-bold">
        <span className="text-foreground">Desaku</span>
        <span className="text-primary">Wisataku</span>
      </span>
    </div>
  );

  // Mobile/tablet: menu dalam drawer (dikontrol dari layout induk).
  if (isMobile) {
    return (
      <Drawer
        placement="left"
        open={mobileOpen}
        onClose={onMobileClose}
        styles={{ body: { padding: 0 } }}
      >
        {brand}
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={toggleMenu}
          style={{ borderInlineEnd: "none" }}
        />
      </Drawer>
    );
  }

  // Desktop: sider sticky + collapsible.
  return (
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
      <Menu
        mode="inline"
        inlineCollapsed={collapsed}
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={toggleMenu}
      />
    </Sider>
  );
};

export default SiderLayout;
