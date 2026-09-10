"use client";

import { Anchor } from "antd";
import { useT } from "@/components/i18n/LocaleProvider";

/** Kunci blok syarat & ketentuan (judul + isi per blok). */
const TERMS_BLOCKS = ["s1", "s2", "s3", "s4", "s5"] as const;

/** Kunci blok kebijakan privasi (judul + isi per blok). */
const PRIVACY_BLOCKS = ["s1", "s2", "s3", "s4", "s5", "s6"] as const;

/**
 * Halaman Perjanjian Pengguna: gabungan Syarat & Ketentuan
 * (#terms) dan Kebijakan Privasi (#privacy-policy) — keduanya tetap
 * terpisah sebagai anchor utama, sesuai tautan footer. Navigasi
 * Anchor (antd) di kanan menandai blok aktif saat scroll.
 */
export function UserAgreementSection() {
  const { t } = useT();

  const anchorItems = [
    {
      key: "terms",
      href: "#terms",
      title: t("terms.title"),
      children: TERMS_BLOCKS.map((key) => ({
        key: `terms-${key}`,
        href: `#terms-${key}`,
        title: t(`terms.${key}.title`),
      })),
    },
    {
      key: "privacy-policy",
      href: "#privacy-policy",
      title: t("privacy.title"),
      children: PRIVACY_BLOCKS.map((key) => ({
        key: `privacy-${key}`,
        href: `#privacy-${key}`,
        title: t(`privacy.${key}.title`),
      })),
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-bold">
        {t("userAgreement.title")}
      </h1>
      <p className="mt-2 text-justify leading-relaxed text-foreground/80">
        {t("userAgreement.intro")}
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_200px]">
        <div className="space-y-12">
          {/* Syarat & Ketentuan — anchor utama #terms. */}
          <section id="terms" className="scroll-mt-24">
            <h2 className="text-xl md:text-2xl font-bold">
              {t("terms.title")}
            </h2>
            <p className="mt-3 text-justify leading-relaxed text-foreground/80">
              {t("terms.intro")}
            </p>

            <div className="mt-6 space-y-8">
              {TERMS_BLOCKS.map((key, index) => (
                <section
                  key={`terms-${key}`}
                  id={`terms-${key}`}
                  className="scroll-mt-24"
                >
                  <h3 className="text-lg font-semibold">
                    <span className="mr-2 text-primary">{index + 1}.</span>
                    {t(`terms.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-justify leading-relaxed text-foreground/80">
                    {t(`terms.${key}.body`)}
                  </p>
                </section>
              ))}
            </div>
          </section>

          {/* Kebijakan Privasi — anchor utama #privacy-policy. */}
          <section id="privacy-policy" className="scroll-mt-24">
            <h2 className="text-xl md:text-2xl font-bold">
              {t("privacy.title")}
            </h2>
            <p className="mt-1 text-sm text-foreground/50">
              {t("privacy.updated")}
            </p>

            <div className="mt-6 space-y-8">
              {PRIVACY_BLOCKS.map((key, index) => (
                <section
                  key={`privacy-${key}`}
                  id={`privacy-${key}`}
                  className="scroll-mt-24"
                >
                  <h3 className="text-lg font-semibold">
                    <span className="mr-2 text-primary">{index + 1}.</span>
                    {t(`privacy.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-justify leading-relaxed text-foreground/80">
                    {t(`privacy.${key}.body`)}
                  </p>
                </section>
              ))}
            </div>
          </section>
        </div>

        <aside className="hidden lg:block">
          <Anchor offsetTop={88} items={anchorItems} />
        </aside>
      </div>
    </div>
  );
}
