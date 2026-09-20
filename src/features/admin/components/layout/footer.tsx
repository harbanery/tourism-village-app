"use client";

import { useT } from "@/components/i18n/LocaleProvider";

/** Footer panel admin — mengikuti tema: light mode memakai background
 *  halaman (terang), dark mode memakai surface terangkit agar terbedakan
 *  dari background. */
const Footer = () => {
  const { t } = useT();

  return (
    <footer className="border-t bg-background/20 border-black/5 dark:border-white/10">
      <div className="mx-auto w-full max-w-7xl px-6 py-6">
        <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
          <p className="text-center text-sm font-light tracking-wider text-foreground/60 dark:text-white/60">
            {t("admin.footer.text", { year: 2026 })}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
