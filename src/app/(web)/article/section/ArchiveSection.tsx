"use client";

import { useRouter } from "next/navigation";
import { Card } from "antd";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyBlogs } from "@/models";
import { formatDate } from "@/utils/format";

export function ArchiveSection() {
  const { t, locale } = useT();
  const router = useRouter();

  const archives = Array.from(new Set(dummyBlogs.map((b) => b.datetime.slice(0, 7))))
    .sort()
    .reverse();

  return (
    <Card title={t("articles.archives")}>
      <div className="flex flex-col gap-1">
        {archives.map((month) => (
          <button
            key={month}
            type="button"
            onClick={() => router.push(`/search?date=${month}`)}
            className="cursor-pointer! bg-transparent! text-left! text-sm! text-primary! hover:underline!"
          >
            {formatDate(`${month}-01`, locale)}
          </button>
        ))}
      </div>
    </Card>
  );
}
