"use client";

import { useRouter } from "next/navigation";
import { useT } from "@/components/i18n/LocaleProvider";

export function Footer() {
  const { t } = useT();
  const router = useRouter();

  /** Navigasi via useRouter (konsisten navbar — tanpa <Link>). */
  const goTo = (href: string) => router.push(href);

  return (
    <footer className="border-t border-white/15 bg-primary pt-16">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="mb-2 font-semibold text-white">{t("footer.location")}</h3>
          <p className="text-sm text-white/75">
            Desa Sukamaju, Kecamatan Melati, Kabupaten Sinarwangi, Jawa Barat
          </p>
        </div>
        <div>
          <h3 className="mb-2 font-semibold text-white">{t("footer.hours")}</h3>
          <p className="text-sm text-white/75">{t("footer.hoursValue")}</p>
        </div>
        <div>
          <h3 className="mb-2 font-semibold text-white">{t("footer.contact")}</h3>
          <p className="text-sm text-white/75">
            WhatsApp: +62 812-3456-7890
            <br />
            Email: halo@desakuwisataku.id
          </p>
        </div>
        <div>
          <h3 className="mb-2 font-semibold text-white">{t("footer.links")}</h3>
          <nav className="flex flex-col items-start gap-1">
            {/* Tentang Kami dipindah ke menu navbar; terms & privacy
                digabung di halaman user-agreement (anchor masing-masing). */}
            <button
              type="button"
              onClick={() => goTo("/user-agreement#terms")}
              className="cursor-pointer! bg-transparent! text-left! text-sm! text-white/75! hover:text-white!"
            >
              {t("footer.terms")}
            </button>
            <button
              type="button"
              onClick={() => goTo("/user-agreement#privacy-policy")}
              className="cursor-pointer! bg-transparent! text-left! text-sm! text-white/75! hover:text-white!"
            >
              {t("footer.privacy")}
            </button>
          </nav>
        </div>
      </div>
      <div className="border-t border-white/15 py-4 text-center text-xs text-white/70">
        {t("footer.copyright")} ·{" "}
        <button
          type="button"
          onClick={() => goTo("/admin")}
          className="cursor-pointer! bg-transparent! text-white/70! hover:underline!"
        >
          {t("admin.login.title")}
        </button>
      </div>
    </footer>
  );
}
