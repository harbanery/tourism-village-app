"use client";

import Link from "next/link";
import { Button } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";

export function HeroSection() {
  const { t } = useT();

  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(https://picsum.photos/seed/hero-village/1600/700)" }}
      />
      <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/40 to-black/20" />
      <div className="relative mx-auto max-w-6xl px-4 py-28 md:py-40 text-white">
        <h1 className="text-3xl md:text-5xl font-bold max-w-2xl leading-tight">
          {t("home.hero.title")}
        </h1>
        <p className="mt-4 max-w-xl text-white/85 md:text-lg">{t("home.hero.subtitle")}</p>
        <Link href="/package-detail">
          <Button type="primary" size="large" icon={<ArrowRightOutlined />} className="mt-8">
            {t("home.hero.cta")}
          </Button>
        </Link>
      </div>
    </section>
  );
}
