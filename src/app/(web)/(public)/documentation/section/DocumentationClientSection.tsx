"use client";

import { Card, Empty } from "antd";
import { VideoCameraOutlined } from "@ant-design/icons";
import { useT } from "@/components/i18n/LocaleProvider";

/**
 * Halaman dokumentasi (pengganti vlog + galeri): data foto/video desa
 * belum tersedia — tampilkan status "segera hadir".
 */
export function DocumentationClientSection() {
  const { t } = useT();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-bold">
        {t("documentation.title")}
      </h1>
      <p className="mt-1 text-foreground/60">{t("documentation.subtitle")}</p>
      <Card className="mt-6!">
        <Empty
          image={
            <VideoCameraOutlined className="text-5xl! text-foreground/30!" />
          }
          description={null}
          className="py-8!"
        >
          <p className="text-sm text-foreground/30">
            {t("documentation.comingSoonNote")}
          </p>
        </Empty>
      </Card>
    </div>
  );
}
