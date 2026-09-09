"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Empty, Input, Select, Spin } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { formatDate } from "@/utils/format";
import { displayImage } from "@/utils/image";
import type { WebBlog } from "@/services/blogService";
import { ArchiveSection } from "./ArchiveSection";

/** Mode urutan daftar artikel. */
type SortKey = "newest" | "oldest";

/** Ukuran halaman infinite scroll (pola riwayat belanja profile). */
const PAGE_SIZE = 3;

/**
 * Halaman artikel: daftar blog aktif — data awal diterima via props
 * dari server page (SSR/ISR) sehingga sudah termuat saat render;
 * pencarian, urutan, arsip, dan infinite scroll berjalan di client
 * atas data tersebut (pola portfolio: section tanpa fetching).
 */
export function ArticleListSection({ posts }: { posts: WebBlog[] }) {
  const { t, locale } = useT();
  const router = useRouter();
  /** Kata kunci pencarian (filter lokal judul + penulis). */
  const [keyword, setKeyword] = useState("");
  /** Bulan arsip terpilih (YYYY-MM; null = semua). */
  const [month, setMonth] = useState<string | null>(null);
  /** Urutan daftar (default terbaru duluan). */
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  /** Jumlah artikel yang ditampilkan (infinite scroll, +3 per halaman). */
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  /** Sentinel infinite scroll — diamati IntersectionObserver. */
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const list = posts.filter((post) => {
      const matchMonth = !month || post.datetime.slice(0, 7) === month;
      const matchKeyword =
        !q ||
        [post.title, post.adminName ?? ""].join(" ").toLowerCase().includes(q);
      return matchMonth && matchKeyword;
    });
    return list.sort((a, b) =>
      sortKey === "newest"
        ? b.datetime.localeCompare(a.datetime)
        : a.datetime.localeCompare(b.datetime),
    );
  }, [posts, keyword, month, sortKey]);

  /** Filter/urutan berubah → tampilkan ulang dari halaman pertama
   *  (penyesuaian state saat render — pola resmi React, tanpa effect). */
  const filterKey = `${keyword.trim()}|${month ?? ""}|${sortKey}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setVisibleCount(PAGE_SIZE);
  }

  const hasMore = filtered.length > visibleCount;

  // Infinite scroll: sentinel mendekati viewport → muat halaman berikutnya.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((count) => count + PAGE_SIZE);
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore]);

  /** Artikel yang ditampilkan sesuai halaman infinite scroll saat ini. */
  const visiblePosts = filtered.slice(0, visibleCount);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 lg:grid-cols-[1fr_300px]">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          {t("articles.title")}
        </h1>
        <p className="mt-1 text-foreground/60">{t("articles.subtitle")}</p>

        {/* Pencarian & urutan (pola riwayat belanja). */}
        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input
            allowClear
            prefix={<SearchOutlined className="text-foreground/40!" />}
            placeholder={t("articles.searchPlaceholder")}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            aria-label={t("common.search")}
          />
          <Select
            className="sm:w-36!"
            value={sortKey}
            onChange={setSortKey}
            options={[
              { value: "newest", label: t("articles.sort.newest") },
              { value: "oldest", label: t("articles.sort.oldest") },
            ]}
          />
        </div>

        <div className="mt-6 flex flex-col gap-6">
          {visiblePosts.length === 0 ? (
            <Card>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t("articles.notFound")}
                className="py-10!"
              />
            </Card>
          ) : (
            visiblePosts.map((post) => {
              // Cover Cloudinary dioptimasi CDN (f_auto,q_auto,w_840).
              const { src, unoptimized } = displayImage(post.filename, 840);
              return (
              <Card
                key={post.id}
                cover={
                  post.filename ? (
                    <Image
                      src={src}
                      alt={post.title}
                      width={840}
                      height={504}
                      unoptimized={unoptimized}
                      sizes="(max-width: 1024px) 100vw, 65vw"
                      className="h-56 w-full object-cover"
                    />
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={false}
                      className="grid! h-56! place-items-center!"
                    />
                  )
                }
              >
                <h2 className="text-xl font-semibold">{post.title}</h2>
                <p className="mt-1 text-xs text-foreground/50">
                  {t("articles.postedBy", {
                    date: formatDate(post.datetime, locale, true),
                    author: post.adminName ?? "-",
                  })}
                </p>
                <div
                  className="mt-3 text-foreground/75 line-clamp-2"
                  dangerouslySetInnerHTML={{ __html: post.para }}
                />
                <Button
                  type="link"
                  className="mt-4! px-0! text-primary! hover:text-primary/70!"
                  onClick={() => router.push(`/article/${post.slug}`)}
                >
                  {t("common.readMore")}
                </Button>
              </Card>
              );
            })
          )}
        </div>

        {/* Sentinel infinite scroll — diamati IntersectionObserver; hanya
            aktif saat masih ada artikel berikutnya. */}
        {hasMore && (
          <div ref={sentinelRef} className="py-4 text-center">
            <Spin />
          </div>
        )}
      </div>

      <aside className="flex flex-col gap-6">
        <ArchiveSection
          posts={posts}
          activeMonth={month}
          onSelectMonth={(next) =>
            setMonth((current) => (current === next ? null : next))
          }
        />
      </aside>
    </div>
  );
}
