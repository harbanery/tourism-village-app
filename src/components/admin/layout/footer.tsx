"use client";

import { useT } from "@/components/locale/LocaleProvider";

const Footer = () => {
  const { t } = useT();

  return (
    <footer className="border-t border-black/5 bg-white dark:border-white/10 dark:bg-[#141416]">
      <p className="px-6 py-4 text-center text-xs text-foreground/60">
        {t("admin.footer.text", { year: new Date().getFullYear() })}
      </p>
    </footer>
  );
};

export default Footer;
