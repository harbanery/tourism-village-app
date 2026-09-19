"use client";

import { useRouter } from "next/navigation";
import { Button } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useT } from "@/components/i18n/LocaleProvider";
import { Reveal } from "@/features/web/components/ui/reveal";

export function HeroSection() {
  const { t } = useT();
  const router = useRouter();

  /**
   * CTA hero: gulir halus ke section paket wisata di home (bukan pindah
   * halaman) — section PackagesSection membawa id="packages".
   */
  const goToPackages = () => {
    const target = document.getElementById("packages");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      router.push("/package");
    }
  };

  return (
    <section className="relative flex min-h-[calc(100dvh-4rem)] items-center">
      <div className="relative mx-auto w-full max-w-6xl px-4 py-24 text-white">
        <Reveal>
          <h1 className="font-bold max-w-3xl leading-tight drop-shadow-md">
            <span className="text-3xl md:text-6xl block">
              {t("home.hero.title1")}
            </span>
            <span className="text-3xl md:text-7xl block font-script font-normal tracking-normal">
              Desaku<span className="text-primary">Wisataku</span>
            </span>
          </h1>
        </Reveal>
        <Reveal delay={150}>
          <p className="mt-5 max-w-xl md:text-lg drop-shadow text-white/75">
            <span className="block">{t("home.hero.subtitle1")}</span>
            <span className="block">{t("home.hero.subtitle2")}</span>
          </p>
        </Reveal>
        <Reveal delay={300}>
          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            iconPosition="end"
            className="mt-8!"
            onClick={goToPackages}
          >
            {t("home.hero.cta")}
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
