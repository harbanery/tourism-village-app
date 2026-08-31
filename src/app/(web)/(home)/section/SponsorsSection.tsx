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
 */
export function SponsorsSection() {
  const { t } = useT();

  return (
    <section
      aria-label={t("home.sponsors.title")}
      className="relative overflow-hidden py-10"
    >
      <div className="group relative overflow-hidden">
        {/* Fade tepi agar track terasa "masuk/keluar" halus */}
        <div className="pointer-events-none absolute left-0 z-10 h-full w-4/12 bg-linear-to-r from-black/70 from-0% to-transparent to-100%" />
        <div className="pointer-events-none absolute right-0 z-10 h-full w-4/12 bg-linear-to-l from-black/70 from-0% to-transparent to-100%" />
        <div className="flex w-max animate-scroll items-center gap-16 pr-16 group-hover:[animation-play-state:paused] md:gap-24 md:pr-24">
          {[...sponsorIcons, ...sponsorIcons].map((Icon, index) => (
            <span
              key={`sponsor-icon-${index + 1}`}
              className="flex cursor-pointer items-center gap-16 whitespace-nowrap text-white/50 transition-colors duration-500 hover:text-white md:gap-24"
            >
              <Icon aria-hidden className="shrink-0 text-4xl" />
              <span className="h-1 w-1 rounded-full bg-white/30" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
