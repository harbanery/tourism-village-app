"use client";

import { useRouter } from "next/navigation";
import { useT } from "@/components/locale/LocaleProvider";

export function Footer() {
  const { t } = useT();
  const router = useRouter();

  /** Navigasi via useRouter (konsisten navbar — tanpa <Link>). */
  const goTo = (href: string) => router.push(href);

  return (
    <footer className="border-t border-black/5 bg-white pt-16 dark:border-white/10 dark:bg-[#141416]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="mb-2 font-semibold">{t("footer.location")}</h3>
          <p className="text-sm text-foreground/70">
            Desa Sukamaju, Kecamatan Melati, Kabupaten Sinarwangi, Jawa Barat
          </p>
        </div>
        <div>
          <h3 className="mb-2 font-semibold">{t("footer.hours")}</h3>
          <p className="text-sm text-foreground/70">{t("footer.hoursValue")}</p>
        </div>
        <div>
          <h3 className="mb-2 font-semibold">{t("footer.contact")}</h3>
          <p className="text-sm text-foreground/70">
            WhatsApp: +62 812-3456-7890
            <br />
            Email: halo@desakuwisataku.id
          </p>
        </div>
        <div>
          <h3 className="mb-2 font-semibold">{t("footer.links")}</h3>
          <nav className="flex flex-col items-start gap-1">
            <button
              type="button"
              onClick={() => goTo("/about")}
              className="cursor-pointer! bg-transparent! text-left! text-sm! text-foreground/70! hover:text-primary!"
            >
              {t("footer.about")}
            </button>
            <button
              type="button"
              onClick={() => goTo("/privacy-policy")}
              className="cursor-pointer! bg-transparent! text-left! text-sm! text-foreground/70! hover:text-primary!"
            >
              {t("footer.privacy")}
            </button>
            <button
              type="button"
              onClick={() => goTo("/terms")}
              className="cursor-pointer! bg-transparent! text-left! text-sm! text-foreground/70! hover:text-primary!"
            >
              {t("footer.terms")}
            </button>
          </nav>
        </div>
      </div>
      <div className="border-t border-black/5 py-4 text-center text-xs text-foreground/60 dark:border-white/10">
        {t("footer.copyright")} ·{" "}
        <button
          type="button"
          onClick={() => goTo("/admin")}
          className="cursor-pointer! bg-transparent! hover:underline!"
        >
          {t("admin.login.title")}
        </button>
      </div>
    </footer>
  );
}
