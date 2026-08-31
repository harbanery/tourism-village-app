"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Input } from "antd";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyBlogs } from "@/models";
import { formatDate } from "@/utils/format";

export function ArticleListSection({ children }: { children?: React.ReactNode }) {
  const { t, locale } = useT();
  const router = useRouter();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 lg:grid-cols-[1fr_300px]">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{t("articles.title")}</h1>
        <p className="mt-1 text-foreground/60">{t("articles.subtitle")}</p>
        <div className="mt-6 space-y-6">
          {dummyBlogs.map((post) => (
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
          ))}
        </div>
      </div>

      <aside className="space-y-6">
        <Card title={t("common.search")}>
          <Input.Search
            placeholder={t("articles.searchPlaceholder")}
            onSearch={(keyword) => router.push(`/search?keyword=${encodeURIComponent(keyword)}`)}
            enterButton
          />
        </Card>
        {children}
      </aside>
    </div>
  );
}
