"use client";

import Link from "next/link";
import { Card } from "antd";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyBlogs } from "@/models";
import { formatDate } from "@/utils/format";

export function ArchiveSection() {
  const { t, locale } = useT();

  const archives = Array.from(new Set(dummyBlogs.map((b) => b.datetime.slice(0, 7))))
    .sort()
    .reverse();

  return (
    <Card title={t("articles.archives")}>
      <div className="flex flex-col gap-1">
        {archives.map((month) => (
          <Link
            key={month}
            href={`/search?date=${month}`}
            className="text-sm text-[#0d7a5f] hover:underline"
          >
            {formatDate(`${month}-01`, locale)}
          </Link>
        ))}
      </div>
    </Card>
  );
}
