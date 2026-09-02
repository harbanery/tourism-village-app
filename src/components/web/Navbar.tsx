"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, Button, Drawer, Dropdown } from "antd";
import { LoginOutlined, LogoutOutlined, MenuOutlined, UserOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageToggle } from "@/components/locale/LanguageToggle";

const links = [
  { href: "/article", key: "nav.articles" },
  { href: "/booking", key: "nav.booking" },
  { href: "/gallery", key: "nav.gallery" },
  { href: "/vlog", key: "nav.vlog" },
];

/**
 * Underline animasi: muncul saat hover dan tetap tampil di route aktif.
 * Semua utility diberi important (!) agar tidak ditimpa style default
 * button/antd (navigasi memakai useRouter, bukan <Link>).
 */
function navLinkClass(active: boolean, stacked = false) {
  return [
    "group relative! cursor-pointer! text-sm! font-medium! transition-colors!",
    "after:absolute! after:left-0! after:bottom-0! after:h-0.5! after:w-0! after:rounded-full!",
    "after:bg-primary! after:transition-all! after:duration-300!",
    "hover:after:w-full!",
    stacked ? "px-1! py-2.5! text-left!" : "px-1! py-2!",
    active
      ? "text-primary! after:w-full!"
      : "text-foreground/80! hover:text-foreground!",
  ].join(" ");
}

interface SessionUser {
  id: number;
  name: string;
  email: string;
}

export function Navbar() {
  const { t } = useT();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/web/auth/session");
      const result = await res.json();
      setUser(result.success ? result.data : null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchSession);
  }, [fetchSession]);

  const handleLogout = async () => {
    await fetch("/api/web/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  };

  /** Navigasi via useRouter lalu tutup drawer (bila terbuka). */
  const goTo = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-[#141416]/80 border-b border-black/5 dark:border-white/10">
      <nav className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="cursor-pointer! bg-transparent! text-lg! font-bold! tracking-tight!"
        >
          <span className="text-foreground transition-colors hover:text-foreground/70">
            Desaku
          </span>
          <span className="text-primary">Wisataku</span>
        </button>

        {/* Laptop/desktop: menu biasa. Tablet/mobile: drawer (tombol di bawah). */}
        <div className="hidden lg:flex items-center gap-5">
          {links.map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => router.push(link.href)}
              className={navLinkClass(pathname.startsWith(link.href))}
            >
              {t(link.key)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
          {user ? (
            <Dropdown
              menu={{
                items: [
                  {
                    key: "profile",
                    icon: <UserOutlined />,
                    label: t("nav.profile"),
                    onClick: () => router.push("/profile"),
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
              trigger={["click"]}
            >
              <Avatar
                className="ml-1 cursor-pointer"
                icon={<UserOutlined />}
              />
            </Dropdown>
          ) : (
            <Button
              type="primary"
              icon={<LoginOutlined />}
              className="hidden! sm:inline-flex! ml-1!"
              onClick={() => router.push("/login")}
            >
              {t("nav.login")}
            </Button>
          )}
          <Button
            className="lg:hidden!"
            type="text"
            aria-label="Menu"
            icon={<MenuOutlined />}
            onClick={() => setOpen(true)}
          />
        </div>
      </nav>

      <Drawer
        title={t("nav.menu")}
        placement="right"
        onClose={() => setOpen(false)}
        open={open}
        size="large"
      >
        <nav className="flex flex-col gap-1">
          {links.map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => goTo(link.href)}
              className={navLinkClass(pathname.startsWith(link.href), true)}
            >
              {t(link.key)}
            </button>
          ))}
          {user ? (
            <>
              <button
                type="button"
                onClick={() => goTo("/profile")}
                className={navLinkClass(
                  pathname.startsWith("/profile"),
                  true,
                )}
              >
                {t("nav.profile")}
              </button>
              <Button
                className="mt-2 justify-start! px-1!"
                type="text"
                danger
                icon={<LogoutOutlined />}
                onClick={handleLogout}
              >
                {t("nav.logout")}
              </Button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => goTo("/login")}
              className={navLinkClass(pathname === "/login", true)}
            >
              {t("nav.login")}
            </button>
          )}
        </nav>
      </Drawer>
    </header>
  );
}
