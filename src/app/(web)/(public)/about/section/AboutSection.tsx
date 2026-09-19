"use client";

import { Card } from "antd";
import {
  CustomerServiceOutlined,
  HomeOutlined,
  StarOutlined,
  WalletOutlined,
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
 * Di bawah pengantar ada section "nilai yang kami tawarkan" (anchor
 * #feature) berisi keempat feature home dengan deskripsi lebih
 * lengkap — tombol "Lainnya" di kartu feature home mengarah ke sini.
 */
export function AboutSection() {
  const { t } = useT();

  const features = [
    {
      icon: <HomeOutlined className="text-4xl! text-white!" />,
      title: t("home.why.facility.title"),
      desc: t("about.feature.facility.desc"),
    },
    {
      icon: <CustomerServiceOutlined className="text-4xl! text-white!" />,
      title: t("home.why.service.title"),
      desc: t("about.feature.service.desc"),
    },
    {
      icon: <WalletOutlined className="text-4xl! text-white!" />,
      title: t("home.why.cheap.title"),
      desc: t("about.feature.cheap.desc"),
    },
    {
      icon: <StarOutlined className="text-4xl! text-white!" />,
      title: t("home.why.local.title"),
      desc: t("about.feature.local.desc"),
    },
  ];

  return (
    <>
      <section className="flex min-h-screen items-center justify-center">
        <div className="mx-auto w-full max-w-4xl px-4 py-24 text-center">
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

      {/* Section feature lengkap — tujuan tombol "Lainnya" di home
          (zigzag "gunung" + kartu hitam transparan, konsisten dengan
          feature section home namun deskripsi lebih panjang). */}
      <section id="feature" className="scroll-mt-20">
        <div className="mx-auto w-full max-w-6xl px-4 py-16">
          <Reveal className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">
              {t("about.feature.title")}
            </h2>
            <p className="mt-1 text-white/80 drop-shadow">
              {t("about.feature.subtitle")}
            </p>
          </Reveal>

          <div className="mt-8 grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Reveal
                key={feature.title}
                delay={index * 100}
                className={index % 2 === 0 ? "sm:mt-10" : ""}
              >
                <Card
                  className="h-full! border-white/10! bg-black/60! text-center! backdrop-blur-sm! dark:bg-black/40!"
                  styles={{ body: { height: "100%" } }}
                >
                  <div className="flex h-full flex-col items-center gap-3 text-center">
                    <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-secondary/40">
                      {feature.icon}
                    </span>
                    <h3 className="font-semibold text-lg text-white">
                      {feature.title}
                    </h3>
                    <p className="text-white/80">{feature.desc}</p>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
