"use client";

import { useRouter } from "next/navigation";
import { Button, Card } from "antd";
import {
  CustomerServiceFilled,
  HomeFilled,
  StarFilled,
  WalletFilled,
} from "@ant-design/icons";
import { useT } from "@/components/i18n/LocaleProvider";
import { Reveal } from "@/features/web/components/ui/reveal";

export function FeatureSection() {
  const { t } = useT();
  const router = useRouter();

  const features = [
    {
      icon: <HomeFilled className="text-4xl! text-foreground!" />,
      title: t("home.why.facility.title"),
      desc: t("home.why.facility.desc"),
    },
    {
      icon: <CustomerServiceFilled className="text-4xl! text-foreground!" />,
      title: t("home.why.service.title"),
      desc: t("home.why.service.desc"),
    },
    {
      icon: <WalletFilled className="text-4xl! text-foreground!" />,
      title: t("home.why.cheap.title"),
      desc: t("home.why.cheap.desc"),
    },
    {
      icon: <StarFilled className="text-4xl! text-foreground!" />,
      title: t("home.why.local.title"),
      desc: t("home.why.local.desc"),
    },
  ];

  return (
    <section className="flex min-h-screen items-center">
      <div className="mx-auto w-full max-w-6xl px-4 py-16">
        <Reveal className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">
            {t("home.why.titlePrefix")}{" "}
            <span className="font-script font-bold tracking-normal text-white">
              Desaku
            </span>
            <span className="font-script font-bold tracking-normal text-secondary">
              Wisataku
            </span>
            ?
          </h2>
          <p className="mt-1 text-white/80 drop-shadow">
            {t("home.why.subtitle")}
          </p>
        </Reveal>

        {/* Grid 4 kartu berposisi "gunung" (zigzag): kartu pertama di
            bawah, kedua di atas, bergantian — offset via margin-top di
            div Reveal (parent komponen antd). Background kartu hitam
            transparan (dark mode sedikit lebih transparan) + blur tipis
            agar terbaca di atas hero; tiap kartu punya tombol "Lainnya"
            yang menuju section feature lengkap di /about#feature. */}
        <div className="mt-8 grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Reveal
              key={feature.title}
              delay={index * 100}
              className={index % 2 === 0 ? "sm:mt-10" : ""}
            >
              <Card
                className="h-full! border-white/10! text-center! backdrop-blur-sm! bg-background/50!"
                styles={{ body: { height: "100%" } }}
              >
                <div className="flex h-full flex-col items-center gap-3 text-center">
                  {/* Icon besar di atas dalam wadah rounded menyesuaikan
                      warna card: bg sedikit lebih gelap (secondary solid)
                      + icon sedikit lebih terang (vintage paper). */}
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary/25">
                    {feature.icon}
                  </span>
                  <h3 className="font-semibold text-lg text-foreground/95">
                    {feature.title}
                  </h3>
                  <p className=" text-foreground/80">{feature.desc}</p>
                  {/* mt-auto menjaga tombol rata bawah antar kartu. */}
                  <Button
                    ghost
                    className="mt-auto! border-foreground/70! text-foreground! hover:border-foreground!"
                    onClick={() => router.push("/about#feature")}
                  >
                    {t("home.why.more")}
                  </Button>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
