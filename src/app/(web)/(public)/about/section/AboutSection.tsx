"use client";

import {
  CustomerServiceFilled,
  HomeFilled,
  StarFilled,
  WalletFilled,
} from "@ant-design/icons";
import { useT } from "@/components/i18n/LocaleProvider";
import { Reveal } from "@/features/web/components/ui/reveal";

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
            <span className="font-script font-bold tracking-normal">
              Desaku
              <span className="text-secondary">Wisataku</span>
            </span>
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
 * Di bawah pengantar ada section "nilai yang kami tawarkan" (anchor
 * #feature) berisi keempat feature home sebagai LIST ke bawah tanpa
 * card (icon + judul + deskripsi lengkap) — tombol "Lainnya" di kartu
 * feature home mengarah ke sini.
 */
export function AboutSection() {
  const { t } = useT();

  const features = [
    {
      icon: <HomeFilled className="text-3xl! text-white!" />,
      title: t("home.why.facility.title"),
      desc: t("about.feature.facility.desc"),
    },
    {
      icon: <CustomerServiceFilled className="text-3xl! text-white!" />,
      title: t("home.why.service.title"),
      desc: t("about.feature.service.desc"),
    },
    {
      icon: <WalletFilled className="text-3xl! text-white!" />,
      title: t("home.why.cheap.title"),
      desc: t("about.feature.cheap.desc"),
    },
    {
      icon: <StarFilled className="text-3xl! text-white!" />,
      title: t("home.why.local.title"),
      desc: t("about.feature.local.desc"),
    },
  ];

  return (
    <>
      <section className="flex min-h-screen items-center justify-center">
        <div className="mx-auto w-full max-w-4xl px-4 text-center">
          <Reveal>
            <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow">
              {t("about.title")}
            </h1>
            <p className="mt-1 text-white/60">{t("about.subtitle")}</p>
          </Reveal>

          <div className="mt-8 space-y-5 text-white/80">
            <Reveal delay={100}>
              <p className="leading-relaxed drop-shadow">
                <BrandText text={t("about.p1")} />
              </p>
            </Reveal>
            <Reveal delay={200}>
              <p className="leading-relaxed drop-shadow">
                <BrandText text={t("about.p2")} />
              </p>
            </Reveal>
            <Reveal delay={300}>
              <p className="leading-relaxed drop-shadow">
                <BrandText text={t("about.p3")} />
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Section feature lengkap — tujuan tombol "Lainnya" di home.
          LIST ke bawah tanpa card: tiap baris icon (bg secondary,
          icon primary — konsisten feature home) + judul + deskripsi
          lengkap, dipisah garis tipis. */}
      <section id="feature" className="scroll-mt-20">
        <div className="mx-auto w-full max-w-4xl px-4 py-16">
          <Reveal className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">
              {t("about.feature.title")}
            </h2>
            <p className="mt-1 text-white/80 drop-shadow">
              {t("about.feature.subtitle")}
            </p>
          </Reveal>

          <div className="mt-6 flex flex-col divide-y divide-white/10">
            {features.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 100}>
                <div className="flex items-start gap-5 py-8">
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-secondary/25">
                    {feature.icon}
                  </span>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-white drop-shadow">
                      {feature.title}
                    </h3>
                    <p className="mt-1 leading-relaxed text-white/80 drop-shadow">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
