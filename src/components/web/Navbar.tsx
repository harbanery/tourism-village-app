"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, Drawer } from "antd";
import { LoginOutlined, MenuOutlined } from "@ant-design/icons";
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
 */
function navLinkClass(active: boolean, stacked = false) {
  return [
    "group relative text-sm font-medium transition-colors",
    "after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-0 after:rounded-full",
    "after:bg-primary after:transition-all after:duration-300",
    "hover:after:w-full",
    stacked ? "px-1 py-2.5" : "px-1 py-2",
    active
      ? "text-primary after:w-full"
      : "text-foreground/80 hover:text-foreground",
  ].join(" ");
}

export function Navbar() {
  const { t } = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-[#141416]/80 border-b border-black/5 dark:border-white/10">
      <nav className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          <span className="text-foreground transition-colors hover:text-foreground/70">
            Desaku
          </span>
          <span className="text-primary">Wisataku</span>
        </Link>

        <div className="hidden md:flex items-center gap-5">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={navLinkClass(pathname.startsWith(link.href))}
            >
              {t(link.key)}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
          <Link href="/login" className="hidden sm:block ml-1">
            <Button type="primary" icon={<LoginOutlined />}>
              {t("nav.login")}
            </Button>
          </Link>
          <Button
            className="md:hidden"
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
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={navLinkClass(pathname.startsWith(link.href), true)}
            >
              {t(link.key)}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className={navLinkClass(pathname === "/login", true)}
          >
            {t("nav.login")}
          </Link>
        </nav>
      </Drawer>
    </header>
  );
}
