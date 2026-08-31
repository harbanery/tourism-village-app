"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Breadcrumb, Button, Grid, Layout, Space, theme } from "antd";
import { LogoutOutlined, MenuOutlined, UserOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageToggle } from "@/components/locale/LanguageToggle";
import { matchMenu } from "./menu";

const { Header } = Layout;

const HeaderLayout: React.FC<{
  onMobileMenuClick?: () => void;
}> = ({ onMobileMenuClick }) => {
  const { t } = useT();
  const pathname = usePathname();
  const { token } = theme.useToken();

  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const breadcrumbItems = [
    { title: t("admin.title") },
    { title: t(matchMenu(pathname)?.localeKey ?? "admin.dashboard") },
  ];

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
        // Background mengikuti tema (bukan default gelap Header antd).
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
  );
};

export default HeaderLayout;
