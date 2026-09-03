"use client";

import { useT } from "@/components/locale/LocaleProvider";

/** Footer panel admin — gaya admin-portfolio: hitam gelap, teks terpusat. */
const Footer = () => {
  const { t } = useT();

  return (
    <footer className="border-t border-black/5 bg-[#0a0a0a] dark:border-white/10">
      <div className="mx-auto w-full max-w-7xl px-6 py-6">
        <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
          <p className="text-center text-sm font-light tracking-wider text-white/70">
            {t("admin.footer.text", { year: 2026 })}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
