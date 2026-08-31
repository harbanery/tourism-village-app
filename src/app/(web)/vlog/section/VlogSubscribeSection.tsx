"use client";

import { useMounted } from "@/hooks/useMounted";
import { Button } from "antd";
import { YoutubeOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";

export function VlogSubscribeSection() {
  const { t } = useT();
  const mounted = useMounted();
  if (!mounted) return null;

  return (
    <div className="mt-10 flex flex-wrap justify-center gap-4">
      <Button size="large">{t("vlog.watchMore")}</Button>
      <Button size="large" type="primary" danger icon={<YoutubeOutlined />} href="https://youtube.com">
        {t("vlog.subscribe")}
      </Button>
    </div>
  );
}
