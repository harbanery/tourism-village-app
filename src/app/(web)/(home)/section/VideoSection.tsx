"use client";

import Link from "next/link";
import { Button } from "antd";
import { PlayCircleFilled } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";

export function VideoSection() {
  const { t } = useT();

  return (
    <section className="bg-white dark:bg-[#141416] py-14">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-2xl md:text-3xl font-bold">{t("home.video.title")}</h2>
        <p className="mt-1 text-foreground/60">{t("home.video.subtitle")}</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="aspect-video rounded-xl overflow-hidden">
            <iframe
              className="h-full w-full"
              src="https://www.youtube.com/embed/goiL7aOMsjg"
              title={t("home.video.title")}
              allowFullScreen
            />
          </div>
          <div className="flex flex-col justify-center">
            <PlayCircleFilled className="text-4xl text-[#0d7a5f]" />
            <p className="mt-4 text-foreground/70">{t("home.video.subtitle")}</p>
            <Link href="/vlog">
              <Button className="mt-4 self-start">{t("common.viewAll")}</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
