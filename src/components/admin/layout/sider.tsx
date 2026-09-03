"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button, Drawer, Grid, Layout, Menu, theme } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { menuAdminConfig } from "@/helpers/menu";
import { loadAntdIcon } from "@/components/custom/icon";
import { useAdminSession } from "@/components/admin/session";
import type { AdminRole } from "@prisma/client";

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
  const { session } = useAdminSession();
  const role: AdminRole | null = session?.role ?? null;

  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const [collapsed, setCollapsed] = useState(false);

  // Filter menu sesuai role (AUTHOR hanya dashboard + blog).
  const filteredMenu = useMemo(
    () =>
      menuAdminConfig.filter(
        (item) => role === null || item.roles.includes(role),
      ),
    [role],
  );

  const selectedKey = useMemo(() => {
    const match =
      [...filteredMenu]
        .sort((a, b) => b.link.length - a.link.length)
        .find(
          (item) =>
            pathname === item.link || pathname.startsWith(`${item.link}/`),
        ) ?? filteredMenu[0];
    return match?.link ?? "/admin";
  }, [pathname, filteredMenu]);

  const menuItems = filteredMenu.map((item) => {
    const Icon = loadAntdIcon(item.icon);
    return {
      key: item.link,
      icon: <Icon />,
      label: t(`menu.${item.key}`),
    };
  });

  const toggleMenu = ({ key }: { key: string }) => {
    // Pola admin-portfolio: replace (bukan push) agar history panel bersih.
    router.replace(key);
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

  // Desktop: sider sticky + collapsible (class admin-sider ala admin-portfolio).
  return (
    <Sider
      collapsed={collapsed}
      width={220}
      collapsedWidth={64}
      theme="light"
      className="admin-sider"
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
          aria-label={t("menu.toggle")}
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
