"use client";

import { use } from "react";
import { useMounted } from "@/hooks/useMounted";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Input } from "antd";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyBlogs } from "@/models";
import { formatDate } from "@/utils/format";

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  const { keyword, date } = use(searchParams);
  const { t, locale } = useT();
  const router = useRouter();

  const query = typeof keyword === "string" ? keyword.toLowerCase() : "";
  const dateQuery = typeof date === "string" ? date : "";

  const results = dummyBlogs.filter((post) => {
    if (dateQuery) return post.datetime.startsWith(dateQuery);
    if (query) return post.title.toLowerCase().includes(query);
    return true;
  });

  const mounted = useMounted();
  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 lg:grid-cols-[1fr_300px]">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          {t("articles.searchResults", {
            keyword: query || (dateQuery ? formatDate(`${dateQuery}-01`, locale) : "-"),
          })}
        </h1>
        <div className="mt-6 space-y-6">
          {results.length === 0 ? (
            <Card>
              <p>{t("articles.notFound")}</p>
            </Card>
          ) : (
            results.map((post) => (
              <Card key={post.id} hoverable cover={
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={post.title} src={post.filename} className="h-56 w-full object-cover" />
              }>
                <h2 className="text-xl font-semibold">{post.title}</h2>
                <p className="mt-1 text-xs text-foreground/50">
                  {t("articles.postedBy", {
                    date: formatDate(post.datetime, locale, true),
                    author: post.adminName ?? "-",
                  })}
                </p>
                <div
                  className="mt-3 text-foreground/75 line-clamp-2"
                  dangerouslySetInnerHTML={{ __html: post.paraHeader }}
                />
                <Link href={`/blog/${post.id}`} className="inline-block mt-4">
                  <Button type="link" className="!px-0">
                    {t("common.readMore")}
                  </Button>
                </Link>
              </Card>
            ))
          )}
        </div>
      </div>

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
    </div>
  );
}
