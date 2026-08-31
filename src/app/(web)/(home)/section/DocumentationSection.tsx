"use client";

import Link from "next/link";
import { Button } from "antd";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyVideos } from "@/models";

export function DocumentationSection() {
  const { t } = useT();
  const mainVideo = dummyVideos[0];

  return (
    <section className="flex min-h-screen items-center bg-white dark:bg-[#141416]">
      <div className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="aspect-video overflow-hidden rounded-xl">
            {mainVideo ? (
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${mainVideo.linkCode}`}
                title={mainVideo.name}
                allowFullScreen
              />
            ) : null}
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">
              {t("home.video.title")}
            </h2>
            <p className="mt-2 text-foreground/70">{t("home.video.subtitle")}</p>
            <Link href="/vlog">
              <Button type="primary" className="mt-6">
                {t("common.viewAll")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
