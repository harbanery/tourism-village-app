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
          <h3 className="mb-2 font-semibold text-white">
            {t("footer.location")}
          </h3>
          <p className="text-sm text-white/75">
            Desa Sukamaju, Kecamatan Melati, Kabupaten Sinarwangi, Jawa Barat
          </p>
        </div>
        <div>
          <h3 className="mb-2 font-semibold text-white">{t("footer.hours")}</h3>
          <p className="text-sm text-white/75">{t("footer.hoursValue")}</p>
        </div>
        <div>
          <h3 className="mb-2 font-semibold text-white">
            {t("footer.contact")}
          </h3>
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
      {/* Copyright + pintu masuk admin: lingkaran di pojok kanan bawah
          yang "tembus" (terpotong overflow-hidden) sehingga hanya 1/4
          bagian terlihat; saat hover ia bergeser diagonal ke kiri-atas
          hingga utuh — klik untuk membuka halaman login admin. */}
      <div className="relative overflow-hidden border-t border-white/15 py-4 text-center text-xs text-white/70">
        {t("footer.copyright")}
        <button
          type="button"
          aria-label={t("admin.login.title")}
          title={t("admin.login.title")}
          onClick={() => goTo("/admin")}
          className="group absolute right-0 bottom-0 grid h-16 w-16 cursor-pointer! translate-x-1/2 translate-y-1/2 place-items-center rounded-full border border-white/25 bg-white/10 backdrop-blur-sm transition-all duration-300 ease-out hover:bg-white/40!"
        />
      </div>
    </footer>
  );
}
