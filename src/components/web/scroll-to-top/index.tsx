"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";

/** Kedalaman scroll (px) sebelum tombol muncul (pola portfolio). */
const VISIBLE_THRESHOLD = 480;

/**
 * Tombol scroll ke atas (pola portfolio): muncul setelah halaman cukup
 * digulir, sembunyi kembali di dekat puncak. Slide + fade via transform
 * dan opacity; klik → smooth scroll ke puncak halaman.
 */
export function ScrollToTop() {
  const { t } = useT();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame: number | null = null;

    const sync = () => setVisible(window.scrollY > VISIBLE_THRESHOLD);

    // Sinkronkan posisi awal saat pindah halaman (scroll position reset).
    const reveal = requestAnimationFrame(() => sync());

    const handleScroll = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        sync();
        frame = null;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      cancelAnimationFrame(reveal);
      window.removeEventListener("scroll", handleScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return (
    <button
      type="button"
      aria-label={t("common.backToTop")}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={[
        "group fixed bottom-5 left-5 z-40 flex cursor-pointer items-center gap-2",
        "rounded-full border border-black/10 bg-white/80 py-2 pl-3 pr-3 text-sm",
        "text-foreground/70 shadow-sm backdrop-blur-md transition-all duration-500",
        "hover:border-primary/40 hover:text-primary",
        "dark:border-white/15 dark:bg-[#141416]/80 dark:text-foreground/70",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0",
      ].join(" ")}
    >
      <ArrowUpOutlined className="text-xs! transition-transform duration-500 group-hover:-translate-y-0.5" />
      <span className="hidden text-[10px] font-medium uppercase tracking-widest sm:inline">
        {t("common.backToTop")}
      </span>
    </button>
  );
}

export default ScrollToTop;
