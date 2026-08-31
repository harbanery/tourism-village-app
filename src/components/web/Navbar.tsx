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

export function Navbar() {
  const { t } = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-[#141416]/80 border-b border-black/5 dark:border-white/10">
      <nav className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="w-8 h-8 rounded-lg bg-[#0d7a5f] text-white grid place-items-center text-sm">
            DV
          </span>
          <span className="hidden sm:inline">Tempellemahbang</span>
        </Link>

        {/* Menu desktop */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "text-[#0d7a5f] bg-[#0d7a5f]/10"
                    : "text-foreground/80 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                {t(link.key)}
              </Link>
            );
          })}
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

      {/* Menu Mobile */}
      <Drawer
        title={t("nav.menu")}
        placement="right"
        onClose={() => setOpen(false)}
        open={open}
        size="large"
      >
        <div className="flex flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
            >
              {t(link.key)}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="px-3 py-2 rounded-md text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
          >
            {t("nav.login")}
          </Link>
        </div>
      </Drawer>
    </header>
  );
}
