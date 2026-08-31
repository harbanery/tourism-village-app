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
        <h1 className="text-3xl md:text-5xl font-bold max-w-2xl leading-tight drop-shadow-md">
          {t("home.hero.title")}
        </h1>
        <p className="mt-4 max-w-xl text-white/85 md:text-lg drop-shadow">
          {t("home.hero.subtitle")}
        </p>
        <Link href="/package">
          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            className="mt-8"
          >
            {t("home.hero.cta")}
          </Button>
        </Link>
      </div>
    </section>
  );
}
