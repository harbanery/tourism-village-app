"use client";

import { useRouter } from "next/navigation";
import { Card, Input } from "antd";
import { useT } from "@/components/locale/LocaleProvider";

export function SearchSidebarSection() {
  const { t } = useT();
  const router = useRouter();

  return (
    <aside>
      <Card title={t("common.search")}>
        <Input.Search
          placeholder={t("articles.searchPlaceholder")}
          onSearch={(value) => {
            router.push(`/search?keyword=${encodeURIComponent(value)}`);
          }}
          enterButton
        />
      </Card>
    </aside>
  );
}
