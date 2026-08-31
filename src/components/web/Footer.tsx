"use client";

import Link from "next/link";
import { useT } from "@/components/locale/LocaleProvider";

export function Footer() {
  const { t } = useT();
  return (
    <footer className="mt-16 border-t border-black/5 dark:border-white/10 bg-white dark:bg-[#141416]">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 sm:grid-cols-3">
        <div>
          <h3 className="font-semibold mb-2">{t("footer.location")}</h3>
          <p className="text-sm text-foreground/70">
            Desa Tempellemahbang, Pasir Eurih, Tamansari, Kabupaten Bogor, Jawa
            Barat
          </p>
        </div>
        <div>
          <h3 className="font-semibold mb-2">{t("footer.hours")}</h3>
          <p className="text-sm text-foreground/70">{t("footer.hoursValue")}</p>
        </div>
        <div>
          <h3 className="font-semibold mb-2">{t("footer.contact")}</h3>
          <p className="text-sm text-foreground/70">
            WhatsApp: +62 896-0556-7347
            <br />
            Email: halo@tempellemahbang.id
          </p>
        </div>
      </div>
      <div className="border-t border-black/5 dark:border-white/10 py-4 text-center text-xs text-foreground/60">
        {t("footer.copyright")} ·{" "}
        <Link href="/admin" className="hover:underline">
          {t("admin.login.title")}
        </Link>
      </div>
    </footer>
  );
}
