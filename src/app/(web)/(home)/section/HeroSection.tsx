"use client";

import Link from "next/link";
import { Button } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";

export function HeroSection() {
  const { t } = useT();

  return (
    <section className="relative flex min-h-[calc(100dvh-4rem)] items-center">
      <div className="relative mx-auto w-full max-w-6xl px-4 py-24 text-white">
        <h1 className="text-3xl md:text-6xl font-bold max-w-3xl leading-tight drop-shadow-md">
          <span className="block">{t("home.hero.title1")}</span>
          <span className="block">
            Desaku<span className="text-primary">Wisataku</span>
          </span>
        </h1>
        <p className="mt-5 max-w-xl md:text-lg drop-shadow text-white/75">
          <span className="block">{t("home.hero.subtitle1")}</span>
          <span className="block">{t("home.hero.subtitle2")}</span>
        </p>
        <Link href="/package">
          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            className="mt-8!"
          >
            {t("home.hero.cta")}
          </Button>
        </Link>
      </div>
    </section>
  );
}
