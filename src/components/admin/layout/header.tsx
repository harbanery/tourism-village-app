"use client";

import { usePathname, useRouter } from "next/navigation";
import { Avatar, Breadcrumb, Button, Grid, Layout, Space, Tag, theme } from "antd";
import { LogoutOutlined, MenuOutlined, UserOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageToggle } from "@/components/locale/LanguageToggle";
import { menuAdminConfig } from "@/helpers/menu";
import { useAdminSession } from "@/components/admin/session";

const { Header } = Layout;

const HeaderLayout: React.FC<{
  onMobileMenuClick?: () => void;
}> = ({ onMobileMenuClick }) => {
  const { t } = useT();
  const pathname = usePathname();
  const router = useRouter();
  const { token } = theme.useToken();
  const { session } = useAdminSession();

  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const activeMenu =
    [...menuAdminConfig]
      .sort((a, b) => b.link.length - a.link.length)
      .find(
        (item) =>
          pathname === item.link || pathname.startsWith(`${item.link}/`),
      ) ?? menuAdminConfig[0];

  const breadcrumbItems = [
    { title: t("admin.title") },
    { title: t(`menu.${activeMenu?.key ?? "dashboard"}`) },
  ];

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.replace("/admin/login");
  };

  return (
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
        backgroundColor: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Space size="small">
        {isMobile && (
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={onMobileMenuClick}
            aria-label="Open menu"
          />
        )}
        <Breadcrumb style={{ fontWeight: 600 }} items={breadcrumbItems} />
      </Space>
      <Space size="middle">
        <LanguageToggle />
        <ThemeToggle />
        {session && (
          <Tag color={session.role === "MASTER" ? "green" : session.role === "AUTHOR" ? "blue" : "default"}>
            {t(`admin.role.${session.role}`)}
          </Tag>
        )}
        <Avatar
          style={{ backgroundColor: token.colorPrimary, cursor: "pointer" }}
          icon={<UserOutlined />}
        />
        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          aria-label={t("nav.logout")}
        />
      </Space>
    </Header>
  );
};

export default HeaderLayout;
