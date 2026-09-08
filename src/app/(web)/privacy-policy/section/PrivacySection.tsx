"use client";

import { Anchor } from "antd";
import { useT } from "@/components/locale/LocaleProvider";

/** Kunci blok kebijakan privasi (judul + isi per blok). */
const BLOCKS = ["s1", "s2", "s3", "s4", "s5", "s6"] as const;

/**
 * Halaman Kebijakan Privasi — ringkas dan selaras dengan UU PDP:
 * data yang dikumpulkan, penggunaan, cookie, pembagian ke penyedia
 * layanan, keamanan, serta hak pengguna. Navigasi Anchor (antd) di kanan
 * menandai blok aktif saat scroll.
 */
export function PrivacySection() {
  const { t } = useT();

  const anchorItems = BLOCKS.map((key) => ({
    key,
    href: `#${key}`,
    title: t(`privacy.${key}.title`),
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-bold">
        {t("privacy.title")}
      </h1>
      <p className="mt-1 text-sm text-foreground/50">{t("privacy.updated")}</p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_200px]">
        <div className="space-y-8">
          {BLOCKS.map((key, index) => (
            <section key={key} id={key} className="scroll-mt-24">
              <h2 className="text-lg font-semibold">
                <span className="mr-2 text-primary">{index + 1}.</span>
                {t(`privacy.${key}.title`)}
              </h2>
              <p className="mt-2 text-justify leading-relaxed text-foreground/80">
                {t(`privacy.${key}.body`)}
              </p>
            </section>
          ))}
        </div>

        <aside className="hidden lg:block">
          <Anchor offsetTop={88} items={anchorItems} />
        </aside>
      </div>
    </div>
  );
}
