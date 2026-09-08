"use client";

import { useT } from "@/components/locale/LocaleProvider";

/** Kunci blok syarat & ketentuan (judul + isi per blok). */
const BLOCKS = ["s1", "s2", "s3", "s4", "s5"] as const;

/**
 * Halaman Syarat & Ketentuan: penggunaan situs, akun, pemesanan &
 * pembayaran (QRIS), pembatalan, dan perubahan syarat.
 */
export function TermsSection() {
  const { t } = useT();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-bold">{t("terms.title")}</h1>

      <p className="mt-4 leading-relaxed text-foreground/80">
        {t("terms.intro")}
      </p>

      <div className="mt-6 space-y-8">
        {BLOCKS.map((key, index) => (
          <section key={key}>
            <h2 className="text-lg font-semibold">
              <span className="mr-2 text-primary">{index + 1}.</span>
              {t(`terms.${key}.title`)}
            </h2>
            <p className="mt-2 leading-relaxed text-foreground/80">
              {t(`terms.${key}.body`)}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
