"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Empty, Input, Skeleton } from "antd";
import { useT } from "@/components/locale/LocaleProvider";
import { formatDate } from "@/utils/format";
import { ArchiveSection } from "./ArchiveSection";

/** Blog aktif dari /api/web/blogs (kelola admin). */
export interface WebBlog {
  id: string;
  slug: string;
  title: string;
  filename: string;
  /** Gabungan paragraf rich text (pembuka + isi). */
  para: string;
  datetime: string;
  datetimeAfter: string | null;
  adminName: string | null;
}

/**
 * Halaman artikel: daftar blog aktif dari DB + filter lokal (kata kunci &
 * arsip bulan) di kolom kanan — tanpa navigasi ke halaman pencarian.
 */
export function ArticleListSection() {
  const { t, locale } = useT();
  const router = useRouter();
  const [posts, setPosts] = useState<WebBlog[]>([]);
  const [loading, setLoading] = useState(true);
  /** Kata kunci pencarian (filter lokal judul + penulis). */
  const [keyword, setKeyword] = useState("");
  /** Bulan arsip terpilih (YYYY-MM; null = semua). */
  const [month, setMonth] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/web/blogs");
      const json = await res.json();
      if (json.success) setPosts(json.data);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchPosts);
  }, [fetchPosts]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return posts.filter((post) => {
      const matchMonth = !month || post.datetime.slice(0, 7) === month;
      const matchKeyword =
        !q ||
        [post.title, post.adminName ?? ""].join(" ").toLowerCase().includes(q);
      return matchMonth && matchKeyword;
    });
  }, [posts, keyword, month]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 lg:grid-cols-[1fr_300px]">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          {t("articles.title")}
        </h1>
        <p className="mt-1 text-foreground/60">{t("articles.subtitle")}</p>
        <div className="mt-6 flex flex-col gap-6">
          {loading ? (
            [1, 2].map((key) => (
              <Card key={key}>
                <Skeleton active paragraph={{ rows: 3 }} />
              </Card>
            ))
          ) : filtered.length === 0 ? (
            <Card>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t("articles.notFound")}
                className="py-10!"
              />
            </Card>
          ) : (
            filtered.map((post) => (
              <Card
                key={post.id}
                hoverable
                cover={
                  post.filename ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={post.title}
                      src={post.filename}
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
                  className="mt-4! px-0!"
                  onClick={() => router.push(`/article/${post.slug}`)}
                >
                  {t("common.readMore")}
                </Button>
              </Card>
            ))
          )}
        </div>
      </div>

      <aside className="flex flex-col gap-6">
        <Card title={t("common.search")}>
          <Input.Search
            allowClear
            placeholder={t("articles.searchPlaceholder")}
            onSearch={(value) => setKeyword(value)}
            onChange={(e) => {
              if (!e.target.value) setKeyword("");
            }}
            enterButton
          />
        </Card>
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
