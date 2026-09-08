"use client";

import { Card } from "antd";
import {
  CustomerServiceOutlined,
  HomeOutlined,
  StarOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";

/**
 * Halaman Tentang Kami: pengantar DesakuWisataku + nilai yang ditawarkan
 * (kartu nilai memakai key yang sama dengan feature section home).
 */
export function AboutSection() {
  const { t } = useT();

  const values = [
    {
      icon: <HomeOutlined className="text-2xl! text-primary!" />,
      title: t("home.why.facility.title"),
      desc: t("home.why.facility.desc"),
    },
    {
      icon: <CustomerServiceOutlined className="text-2xl! text-primary!" />,
      title: t("home.why.service.title"),
      desc: t("home.why.service.desc"),
    },
    {
      icon: <WalletOutlined className="text-2xl! text-primary!" />,
      title: t("home.why.cheap.title"),
      desc: t("home.why.cheap.desc"),
    },
    {
      icon: <StarOutlined className="text-2xl! text-primary!" />,
      title: t("home.why.local.title"),
      desc: t("home.why.local.desc"),
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-bold">{t("about.title")}</h1>
      <p className="mt-1 text-foreground/60">{t("about.subtitle")}</p>

      <div className="mt-6 space-y-4 text-foreground/80">
        <p className="leading-relaxed">{t("about.p1")}</p>
        <p className="leading-relaxed">{t("about.p2")}</p>
        <p className="leading-relaxed">{t("about.p3")}</p>
      </div>

      <h2 className="mt-10 text-xl font-semibold">{t("about.values")}</h2>
      <div className="mt-4 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2">
        {values.map((value) => (
          <Card key={value.title} className="h-full!">
            <div className="flex h-full items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10">
                {value.icon}
              </span>
              <div>
                <h3 className="font-semibold">{value.title}</h3>
                <p className="mt-1 text-sm text-foreground/70">{value.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
