"use client";

import { useT } from "@/components/i18n/LocaleProvider";

/**
 * Render teks dengan merek "DesakuWisataku" disorot: kata "Wisataku"
 * diberi warna primary (pola brand navbar/hero). Kata yang tidak
 * mengandung merek ditampilkan apa adanya.
 */
function BrandText({ text }: { text: string }) {
  const parts = text.split("DesakuWisataku");
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((part, index) => (
        <span key={index}>
          {index > 0 && (
            <>
              Desaku<span className="font-semibold text-primary">Wisataku</span>
            </>
          )}
          {part}
        </span>
      ))}
    </>
  );
}

/**
 * Halaman Tentang Kami: pengantar DesakuWisataku — konten rata tengah
 * (vertikal + horizontal) dalam section min-h-screen, berlatar hero
 * background (dirender oleh page) sehingga teks memakai warna putih.
 * Section "nilai yang kami tawarkan" diambil dari sini (nilai cukup
 * tampil di feature section home).
 */
export function AboutSection() {
  const { t } = useT();

  return (
    <section className="flex min-h-screen items-center justify-center">
      <div className="mx-auto w-full max-w-4xl px-4 py-24 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow">
          {t("about.title")}
        </h1>
        <p className="mt-1 text-white/60">{t("about.subtitle")}</p>

        <div className="mt-8 space-y-5 text-white/80">
          <p className="leading-relaxed drop-shadow">
            <BrandText text={t("about.p1")} />
          </p>
          <p className="leading-relaxed drop-shadow">
            <BrandText text={t("about.p2")} />
          </p>
          <p className="leading-relaxed drop-shadow">
            <BrandText text={t("about.p3")} />
          </p>
        </div>
      </div>
    </section>
  );
}
