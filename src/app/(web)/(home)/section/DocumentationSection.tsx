"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Skeleton } from "antd";
import { VideoCameraOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";

/** Video dokumentasi aktif dari /api/web/videos (kelola admin). */
interface WebVideo {
  id: string;
  name: string;
  linkCode: string;
  placeName: string | null;
}

export function DocumentationSection() {
  const { t } = useT();
  const router = useRouter();
  const [videos, setVideos] = useState<WebVideo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch("/api/web/videos");
      const json = await res.json();
      if (json.success) setVideos(json.data);
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchVideos);
  }, [fetchVideos]);

  const mainVideo = videos[0];

  return (
    <section className="flex max-h-screen items-center bg-white dark:bg-[#141416] py-14">
      <div className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="aspect-video overflow-hidden rounded-xl">
            {loading ? (
              <Skeleton.Node active className="h-full! w-full!" />
            ) : mainVideo ? (
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
