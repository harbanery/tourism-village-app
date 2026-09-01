"use client";

import { useMounted } from "@/helpers/useMounted";
import { Button } from "antd";
import { InstagramOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";

export function GalleryInstagramSection() {
  const { t } = useT();
  const mounted = useMounted();
  if (!mounted) return null;

  return (
    <div className="mt-12 text-center">
      <Button size="large" icon={<InstagramOutlined />} href="https://instagram.com">
        {t("gallery.followInstagram")}
      </Button>
    </div>
  );
}
