"use client";

import { useT } from "@/components/locale/LocaleProvider";

/** Kunci blok kebijakan privasi (judul + isi per blok). */
const BLOCKS = ["s1", "s2", "s3", "s4", "s5", "s6"] as const;

/**
 * Halaman Kebijakan Privasi — ringkas dan selaras dengan UU PDP:
 * data yang dikumpulkan, penggunaan, cookie, pembagian ke penyedia
 * layanan, keamanan, serta hak pengguna.
 */
export function PrivacySection() {
  const { t } = useT();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-bold">
        {t("privacy.title")}
      </h1>
      <p className="mt-1 text-sm text-foreground/50">{t("privacy.updated")}</p>

      <div className="mt-6 space-y-8">
        {BLOCKS.map((key, index) => (
          <section key={key}>
            <h2 className="text-lg font-semibold">
              <span className="mr-2 text-primary">{index + 1}.</span>
              {t(`privacy.${key}.title`)}
            </h2>
            <p className="mt-2 leading-relaxed text-foreground/80">
              {t(`privacy.${key}.body`)}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
