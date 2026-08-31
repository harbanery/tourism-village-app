"use client";

import { Card } from "antd";
import {
  CustomerServiceOutlined,
  HomeOutlined,
  StarOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";

export function FeatureSection() {
  const { t } = useT();

  const features = [
    {
      icon: <HomeOutlined className="text-2xl text-primary" />,
      title: t("home.why.facility.title"),
      desc: t("home.why.facility.desc"),
    },
    {
      icon: <CustomerServiceOutlined className="text-2xl text-primary" />,
      title: t("home.why.service.title"),
      desc: t("home.why.service.desc"),
    },
    {
      icon: <WalletOutlined className="text-2xl text-primary" />,
      title: t("home.why.cheap.title"),
      desc: t("home.why.cheap.desc"),
    },
    {
      icon: <StarOutlined className="text-2xl text-primary" />,
      title: t("home.why.local.title"),
      desc: t("home.why.local.desc"),
    },
  ];

  return (
    <section className="flex min-h-screen items-center">
      <div className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">
            {t("home.why.title")}
          </h2>
          <p className="mt-1 text-white/80 drop-shadow">
            {t("home.why.subtitle")}
          </p>
        </div>

        {/* Grid 2 kolom; items-stretch + h-full membuat semua card setinggi sama. */}
        <div className="mt-8 grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature.title} className="h-full" styles={{ body: { height: "100%" } }}>
              <div className="flex h-full items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10">
                  {feature.icon}
                </span>
                <div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="mt-1 text-foreground/70">{feature.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
