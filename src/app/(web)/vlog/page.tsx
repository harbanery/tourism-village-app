"use client";

import { useMounted } from "@/hooks/useMounted";
import { Button, Card } from "antd";
import { YoutubeOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyVideos } from "@/models";

export default function VlogPage() {
  const { t } = useT();
  const mounted = useMounted();
  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-bold">{t("vlog.title")}</h1>
      <p className="mt-1 text-foreground/60">{t("vlog.subtitle")}</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {dummyVideos.map((video) => (
          <Card key={video.id} title={video.name} extra={<span className="text-xs text-foreground/50">{video.placeName}</span>}>
            <div className="aspect-video overflow-hidden rounded-lg">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${video.linkCode}`}
                title={video.name}
                allowFullScreen
              />
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Button size="large">{t("vlog.watchMore")}</Button>
        <Button size="large" type="primary" danger icon={<YoutubeOutlined />} href="https://youtube.com">
          {t("vlog.subscribe")}
        </Button>
      </div>
    </div>
  );
}
