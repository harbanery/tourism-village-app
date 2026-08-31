"use client";

import {
  AimOutlined,
  CameraOutlined,
  CoffeeOutlined,
  CompassOutlined,
  GiftOutlined,
  HomeOutlined,
  ShopOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";

/** Dummy "logo" sponsor — hanya icon, tanpa nama atau card. */
const sponsorIcons = [
  CompassOutlined,
  CoffeeOutlined,
  CameraOutlined,
  HomeOutlined,
  ThunderboltOutlined,
  GiftOutlined,
  ShopOutlined,
  AimOutlined,
];

/**
 * Marquee sponsor — pola skills-marquee portfolio: track diduplikasi lalu
 * discroll linear terus-menerus (animate-scroll), berhenti saat hover.
 * Gradient tepi memudar ke background section (putih / gelap saat dark).
 */
export function SponsorsSection() {
  const { t } = useT();

  return (
    <section className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-[#141416]">
      <div className="w-full">
        <p className="text-center text-sm font-medium uppercase tracking-widest text-foreground/50">
          {t("home.sponsors.label")}
        </p>

        <div className="group relative mt-6 overflow-hidden">
          <div className="pointer-events-none absolute left-0 z-10 h-full w-3/12 bg-linear-to-r from-white to-transparent dark:from-[#141416]" />
          <div className="pointer-events-none absolute right-0 z-10 h-full w-3/12 bg-linear-to-l from-white to-transparent dark:from-[#141416]" />
          <div className="flex w-max animate-scroll items-center gap-16 pr-16 group-hover:[animation-play-state:paused] md:gap-24 md:pr-24">
            {[...sponsorIcons, ...sponsorIcons].map((Icon, index) => (
              <span
                key={`sponsor-icon-${index + 1}`}
                className="flex cursor-pointer items-center gap-16 whitespace-nowrap text-foreground/40 transition-colors duration-500 hover:text-foreground md:gap-24"
              >
                <Icon aria-hidden className="shrink-0 text-4xl" />
                <span className="h-1 w-1 rounded-full bg-foreground/20" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
