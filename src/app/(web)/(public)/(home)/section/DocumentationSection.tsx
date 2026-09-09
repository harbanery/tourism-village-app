"use client";

import { useRouter } from "next/navigation";
import { Button } from "antd";
import { VideoCameraOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import type { ActiveVideo } from "@/services/videoService";

/**
 * Video dokumentasi di home — video pertama di-embed sebagai preview.
 * Data diterima via props dari server page (SSR) sehingga embed langsung
 * termuat saat render; tombol navigasi tetap client-side (useRouter).
 */
export function DocumentationSection({ videos }: { videos: ActiveVideo[] }) {
  const { t } = useT();
  const router = useRouter();

  const mainVideo = videos[0];

  return (
    <section className="flex max-h-screen items-center bg-white dark:bg-[#141416] py-14">
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
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-black/5 text-foreground/50 dark:bg-white/5">
                <VideoCameraOutlined className="text-4xl!" />
                <p className="px-4 text-center text-sm">
                  {t("documentation.comingSoon")}
                </p>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">
              {t("home.video.title")}
            </h2>
            <p className="mt-2 text-foreground/70">
              {t("home.video.subtitle")}
            </p>
            <Button
              type="primary"
              className="mt-6!"
              onClick={() => router.push("/documentation")}
            >
              {t("common.viewAll")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
