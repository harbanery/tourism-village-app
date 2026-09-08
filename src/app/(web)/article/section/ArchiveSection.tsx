"use client";

import { Card, Collapse, Empty } from "antd";
import { useT } from "@/components/locale/LocaleProvider";
import type { WebBlog } from "./ArticleListSection";

/** Tombol bulan arsip — klik memfilter daftar artikel secara lokal
 *  (bulan aktif diklik lagi untuk menghapus filter). */
function MonthButton({
  month,
  label,
  active,
  onClick,
}: {
  month: string;
  label: string;
  active: boolean;
  onClick: (month: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(month)}
      className={
        active
          ? "cursor-pointer! bg-transparent! text-left! text-sm! font-semibold! text-primary!"
          : "cursor-pointer! bg-transparent! text-left! text-sm! text-primary! hover:underline!"
      }
    >
      {label}
    </button>
  );
}

/**
 * Arsip artikel per bulan: bulan tahun berjalan tampil langsung (label
 * bulan saja — tanpa tanggal & tahun); tahun sebelumnya diringkas
 * sebagai collapse per tahun (isinya label bulan).
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

  const currentYear = String(new Date().getFullYear());

  /** Nama bulan saja (mis. "September") sesuai locale aktif. */
  const monthName = (month: string) =>
    new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
      month: "long",
    }).format(new Date(`${month}-01T00:00:00Z`));

  /** Bulan unik (YYYY-MM) dari data blog, terbaru duluan. */
  const months = Array.from(new Set(posts.map((b) => b.datetime.slice(0, 7))))
    .sort()
    .reverse();

  const currentYearMonths = months.filter((m) => m.startsWith(currentYear));
  /** Tahun sebelumnya (desc) beserta bulannya. */
  const olderGroups = Array.from(
    new Set(
      months
        .filter((m) => !m.startsWith(currentYear))
        .map((m) => m.slice(0, 4)),
    ),
  )
    .sort()
    .reverse()
    .map((year) => ({
      year,
      months: months.filter((m) => m.startsWith(year)),
    }));

  return (
    <Card title={t("articles.archives")}>
      {months.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={false}
          className="py-4!"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {/* Bulan tahun berjalan — tampil langsung tanpa pengelompokan. */}
          {currentYearMonths.length > 0 && (
            <div className="flex flex-col gap-1">
              {currentYearMonths.map((month) => (
                <MonthButton
                  key={month}
                  month={month}
                  label={monthName(month)}
                  active={activeMonth === month}
                  onClick={onSelectMonth}
                />
              ))}
            </div>
          )}

          {/* Tahun sebelumnya — collapse per tahun berisi bulan-bulannya. */}
          {olderGroups.length > 0 && (
            <Collapse
              ghost
              size="small"
              className="-mx-2!"
              items={olderGroups.map((group) => ({
                key: group.year,
                label: (
                  <span className="text-sm font-medium">{group.year}</span>
                ),
                children: (
                  <div className="flex flex-col gap-1">
                    {group.months.map((month) => (
                      <MonthButton
                        key={month}
                        month={month}
                        label={monthName(month)}
                        active={activeMonth === month}
                        onClick={onSelectMonth}
                      />
                    ))}
                  </div>
                ),
              }))}
            />
          )}
        </div>
      )}
    </Card>
  );
}
