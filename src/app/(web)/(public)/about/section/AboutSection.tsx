"use client";

import {
  CustomerServiceOutlined,
  HomeOutlined,
  StarOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { useT } from "@/components/i18n/LocaleProvider";

/**
 * Halaman Tentang Kami: pengantar DesakuWisataku + nilai yang ditawarkan
 * (key yang sama dengan feature section home). Judul rata tengah,
 * deskripsi rata kanan-kiri (justify), nilai tampil sederhana — icon +
 * teks tanpa card/grid.
 */
export function AboutSection() {
  const { t } = useT();

  const values = [
    {
      icon: <HomeOutlined className="text-xl! text-primary!" />,
      title: t("home.why.facility.title"),
      desc: t("home.why.facility.desc"),
    },
    {
      icon: <CustomerServiceOutlined className="text-xl! text-primary!" />,
      title: t("home.why.service.title"),
      desc: t("home.why.service.desc"),
    },
    {
      icon: <WalletOutlined className="text-xl! text-primary!" />,
      title: t("home.why.cheap.title"),
      desc: t("home.why.cheap.desc"),
    },
    {
      icon: <StarOutlined className="text-xl! text-primary!" />,
      title: t("home.why.local.title"),
      desc: t("home.why.local.desc"),
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-center text-2xl md:text-3xl font-bold">
        {t("about.title")}
      </h1>
      <p className="mt-1 text-center text-foreground/60">{t("about.subtitle")}</p>

      <div className="mt-6 space-y-4 text-foreground/80">
        <p className="text-justify leading-relaxed">{t("about.p1")}</p>
        <p className="text-justify leading-relaxed">{t("about.p2")}</p>
        <p className="text-justify leading-relaxed">{t("about.p3")}</p>
      </div>

      <h2 className="mt-10 text-center text-xl font-semibold">
        {t("about.values")}
      </h2>
      <div className="mt-6 flex flex-col gap-5">
        {values.map((value) => (
          <div key={value.title} className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0">{value.icon}</span>
            <div>
              <h3 className="font-semibold">{value.title}</h3>
              <p className="mt-0.5 text-sm text-foreground/70">{value.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
