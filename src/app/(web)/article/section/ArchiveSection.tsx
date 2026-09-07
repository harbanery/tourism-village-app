"use client";

import { Card } from "antd";
import { useT } from "@/components/locale/LocaleProvider";
import { formatDate } from "@/utils/format";
import type { WebBlog } from "./ArticleListSection";

/**
 * Arsip bulan dari data blog — klik memfilter daftar artikel secara lokal
 * (bulan aktif diklik lagi untuk menghapus filter).
 */
export function ArchiveSection({
  posts,
  activeMonth,
  onSelectMonth,
}: {
  posts: WebBlog[];
  activeMonth: string | null;
  onSelectMonth: (month: string) => void;
}) {
  const { t, locale } = useT();

  const archives = Array.from(new Set(posts.map((b) => b.datetime.slice(0, 7))))
    .sort()
    .reverse();

  return (
    <Card title={t("articles.archives")}>
      <div className="flex flex-col gap-1">
        {archives.map((month) => (
          <button
            key={month}
            type="button"
            onClick={() => onSelectMonth(month)}
            className={
              activeMonth === month
                ? "cursor-pointer! bg-transparent! text-left! text-sm! font-semibold! text-primary!"
                : "cursor-pointer! bg-transparent! text-left! text-sm! text-primary! hover:underline!"
            }
          >
            {formatDate(`${month}-01`, locale)}
          </button>
        ))}
      </div>
    </Card>
  );
}
