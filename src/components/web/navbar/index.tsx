"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, Button, Drawer, Dropdown } from "antd";
import {
  HistoryOutlined,
  LoginOutlined,
  LogoutOutlined,
  MenuOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageToggle } from "@/components/locale/LanguageToggle";
import { NotificationBell } from "@/components/web/NotificationBell";
import { clearWebSession, useWebSession } from "@/components/web/session";

const links = [
  { href: "/article", key: "nav.articles" },
  { href: "/tourism", key: "nav.tourism" },
  { href: "/documentation", key: "nav.documentation" },
];

/** Threshold scroll (px) untuk menganggap halaman sudah digulir. */
const SCROLLED_THRESHOLD = 10;

/** Jeda tanpa event scroll (ms) sebelum navbar dianggap "berhenti". */
const SCROLL_STOP_MS = 200;

/** Sensitivitas arah scroll (px) — hindari flicker pada scroll kecil. */
const DIRECTION_EPSILON = 4;

/**
 * Underline animasi: muncul saat hover dan tetap tampil di route aktif.
 * Semua utility diberi important (!) agar tidak ditimpa style default
 * button/antd (navigasi memakai useRouter, bukan <Link>).
 *
 * `onHero` (navbar transparan di atas hero home): teks putih dengan
 * underline putih agar tetap terbaca di atas background gambar.
 */
function navLinkClass(active: boolean, stacked = false, onHero = false) {
  const color = onHero
    ? "text-white/85! hover:text-white!"
    : "text-foreground/80! hover:text-foreground!";
  const underline = onHero ? "after:bg-white!" : "after:bg-primary!";
  return [
    "group relative! cursor-pointer! text-sm! font-medium! transition-colors!",
    "after:absolute! after:left-0! after:bottom-0! after:h-0.5! after:w-0! after:rounded-full!",
    underline,
    "after:transition-all! after:duration-300!",
    "hover:after:w-full!",
    stacked ? "px-1! py-2.5! text-left!" : "px-1! py-2!",
    active
      ? onHero
        ? "text-white! after:w-full!"
        : "text-primary! after:w-full!"
      : color,
  ].join(" ");
}

export function Navbar() {
  const { t } = useT();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  /** Sesi user — store bersama dengan dedup (tidak refetch per halaman). */
  const { user } = useWebSession();

  /** Navbar disembunyikan oleh scroll ke bawah (pola portfolio). */
  const [shouldShow, setShouldShow] = useState(true);
  /** Halaman sudah digulir — di home memicu bg + blur + teks tema. */
  const [scrolled, setScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  const isHome = pathname === "/";
  /** Mode hero: hanya di paling atas home — transparan, tanpa blur, teks putih. */
  const onHero = isHome && !scrolled;

  /**
   * Perilaku scroll (pola navbar portfolio + tampil saat berhenti):
   * - scroll ke bawah → navbar slides keluar (translate) ke atas;
   * - scroll ke atas  → navbar tampil kembali;
   * - scroll berhenti → navbar tampil kembali.
   * Hanya transform yang dianimasikan — animasi opacity pada elemen
   * dengan backdrop-filter membuat blur berkedip saat transisi.
   */
  useEffect(() => {
    let ticking = false;
    let stopTimer: ReturnType<typeof setTimeout> | null = null;

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        globalThis.requestAnimationFrame(() => {
          const y = window.scrollY;
          setScrolled(y > SCROLLED_THRESHOLD);

          if (y <= SCROLLED_THRESHOLD) {
            setShouldShow(true);
          } else if (y > lastScrollY + DIRECTION_EPSILON) {
            setShouldShow(false);
          } else if (y < lastScrollY - DIRECTION_EPSILON) {
            setShouldShow(true);
          }
          setLastScrollY(y);
          ticking = false;
        });
      }

      // Scroll berhenti (tidak ada event baru) → tampilkan navbar lagi.
      if (stopTimer) clearTimeout(stopTimer);
      stopTimer = setTimeout(() => setShouldShow(true), SCROLL_STOP_MS);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (stopTimer) clearTimeout(stopTimer);
    };
  }, [lastScrollY]);

  const handleLogout = async () => {
    await fetch("/api/web/auth/logout", { method: "POST" });
    clearWebSession();
    router.push("/");
    router.refresh();
  };

  /** Navigasi via useRouter lalu tutup drawer (bila terbuka). */
  const goTo = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  /** Wrapper tombol aksi kanan: saat mode hero, paksa ikon antd putih. */
  const actionWrap = onHero ? "[&_.ant-btn]:text-white!" : undefined;

  return (
    <header
      className={[
        "sticky top-0 z-50 border-b transition-all duration-500 ease-in-out",
        shouldShow ? "translate-y-0" : "-translate-y-full",
        onHero
          ? "border-transparent bg-transparent text-white"
          : "border-black/5 bg-white/80 text-foreground backdrop-blur-md dark:border-white/10 dark:bg-[#141416]/80",
      ].join(" ")}
    >
      <nav className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="group cursor-pointer bg-transparent text-lg font-bold tracking-tight"
        >
          {/* Hover di area brand → seluruh teks berubah warna bersamaan. */}
          <span
            className={`transition-colors ${
              onHero
                ? "text-white group-hover:text-white/60"
                : "text-foreground group-hover:text-foreground/60"
            }`}
          >
            Desaku
          </span>
          <span className="text-primary transition-colors group-hover:text-primary/60">
            Wisataku
          </span>
        </button>

        {/* Laptop/desktop: menu biasa. Tablet/mobile: drawer (tombol di bawah). */}
        <div className="hidden lg:flex items-center gap-5">
          {links.map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => router.push(link.href)}
              className={navLinkClass(
                pathname.startsWith(link.href),
                false,
                onHero,
              )}
            >
              {t(link.key)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <div className={[actionWrap, "flex items-center"].join(" ")}>
            <LanguageToggle />
            <ThemeToggle />
            {user && <NotificationBell />}
          </div>
          {user ? (
            <Dropdown
              menu={{
                items: [
                  {
                    key: "history",
                    icon: <HistoryOutlined />,
                    label: t("profile.orderHistory"),
                    onClick: () => router.push("/profile?view=history"),
                  },
                  {
                    key: "settings",
                    icon: <SettingOutlined />,
                    label: t("settings.title"),
                    onClick: () => router.push("/profile?view=settings"),
                  },
                  { type: "divider" },
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
                className="ml-1! cursor-pointer!"
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
          <div className={actionWrap}>
            <Button
              className="lg:hidden!"
              type="text"
              aria-label={t("nav.menu")}
              icon={<MenuOutlined />}
              onClick={() => setOpen(true)}
            />
          </div>
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
                onClick={() => goTo("/profile?view=history")}
                className={navLinkClass(
                  pathname.startsWith("/profile") && !open,
                  true,
                )}
              >
                {t("profile.orderHistory")}
              </button>
              <button
                type="button"
                onClick={() => goTo("/profile?view=settings")}
                className={navLinkClass(
                  pathname.startsWith("/profile") && !open,
                  true,
                )}
              >
                {t("settings.title")}
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
