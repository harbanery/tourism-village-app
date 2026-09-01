"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Avatar,
  Breadcrumb,
  Button,
  Dropdown,
  Grid,
  Layout,
  Space,
  Tag,
  theme,
} from "antd";
import { LogoutOutlined, MenuOutlined, UserOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageToggle } from "@/components/locale/LanguageToggle";
import { menuAdminConfig } from "@/helpers/menu";
import { useAdminSession } from "@/components/admin/session";
import { ROLE_TAG_COLORS } from "@/components/admin/table";

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
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              {
                key: "role",
                disabled: true,
                label: session ? (
                  <Tag
                    className="m-0!"
                    color={ROLE_TAG_COLORS[session.role] ?? "default"}
                  >
                    {t(`admin.role.${session.role}`)}
                  </Tag>
                ) : (
                  "-"
                ),
              },
              { key: "divider", type: "divider" },
              {
                key: "profile",
                icon: <UserOutlined />,
                label: t("nav.profile"),
                onClick: () => router.push("/admin/profile"),
              },
              {
                key: "logout",
                icon: <LogoutOutlined />,
                danger: true,
                label: t("nav.logout"),
                onClick: handleLogout,
              },
            ],
          }}
        >
          <Avatar
            style={{ backgroundColor: token.colorPrimary, cursor: "pointer" }}
            src={session?.avatar}
            icon={<UserOutlined />}
            aria-label={t("nav.profile")}
          />
        </Dropdown>
      </Space>
    </Header>
  );
};

export default HeaderLayout;
