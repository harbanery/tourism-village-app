"use client";

import { Card } from "antd";
import {
  CustomerServiceOutlined,
  HomeOutlined,
  StarOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { useT } from "@/components/i18n/LocaleProvider";

export function FeatureSection() {
  const { t } = useT();

  const features = [
    {
      icon: <HomeOutlined className="text-4xl! text-white!" />,
      title: t("home.why.facility.title"),
      desc: t("home.why.facility.desc"),
    },
    {
      icon: <CustomerServiceOutlined className="text-4xl! text-white!" />,
      title: t("home.why.service.title"),
      desc: t("home.why.service.desc"),
    },
    {
      icon: <WalletOutlined className="text-4xl! text-white!" />,
      title: t("home.why.cheap.title"),
      desc: t("home.why.cheap.desc"),
    },
    {
      icon: <StarOutlined className="text-4xl! text-white!" />,
      title: t("home.why.local.title"),
      desc: t("home.why.local.desc"),
    },
  ];

  return (
    <section className="flex min-h-screen items-center">
      <div className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">
            {t("home.why.titlePrefix")}{" "}
            <span className="text-white">Desaku</span>
            <span className="text-primary">Wisataku</span>?
          </h2>
          <p className="mt-1 text-white/80 drop-shadow">
            {t("home.why.subtitle")}
          </p>
        </div>

        {/* Grid 4 kartu (responsif: HP 1, tablet 2, ≥lg 4); bg transparan,
            border transparan KECUALI garis atas (tetap ada saat state
            normal maupun hover/focus); hover/focus → gradient rise
            (bawah→atas, semi-transparan; tabIndex agar bisa difokuskan). */}
        <div className="mt-8 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card
              key={feature.title}
              tabIndex={0}
              className="h-full! border-transparent! bg-transparent! text-center! transition-all! duration-300! hover:bg-gradient-rise! focus:bg-gradient-rise! focus:outline-none!"
              styles={{ body: { height: "100%" } }}
            >
              <div className="flex h-full flex-col items-center gap-3 text-center">
                {/* Icon besar di atas dalam wadah rounded transparan
                    bernuansa secondary (pola lama, ukuran lebih besar). */}
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-secondary/10">
                  {feature.icon}
                </span>
                <h3 className="font-semibold text-lg text-white">
                  {feature.title}
                </h3>
                <p className="text-white/80">{feature.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
